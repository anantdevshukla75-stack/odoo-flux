import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from uuid import uuid4

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select, update

from database import discounts, model, products, subscriptions

CENT = Decimal("0.01")


class UnknownCustomerError(Exception):
    pass


class UnknownPlanError(Exception):
    pass


class UnknownTaxError(Exception):
    pass


class UnknownVariantError(Exception):
    pass


class IneligibleDiscountError(Exception):
    pass


class InvalidQuotationTransitionError(Exception):
    pass


def _quotation_statement():
    return select(model.Quotation).options(
        selectinload(model.Quotation.product_lines)
    )


def get_quotation(session: Session, quotation_id: int) -> model.Quotation | None:
    return session.exec(
        _quotation_statement().where(model.Quotation.id == quotation_id)
    ).first()


def list_quotations(
    session: Session,
    *,
    customer_id: int | None = None,
    status: model.QuotationStatus | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Quotation]:
    _expire_due_quotations(session)
    statement = _quotation_statement().order_by(model.Quotation.id.desc())
    if customer_id is not None:
        statement = statement.where(model.Quotation.customer_id == customer_id)
    if status is not None:
        statement = statement.where(model.Quotation.status == status)
    return list(session.exec(statement.offset(offset).limit(limit)).all())


def get_quotation_with_expiry(
    session: Session, quotation_id: int
) -> model.Quotation | None:
    _expire_due_quotations(session, quotation_id=quotation_id)
    return get_quotation(session, quotation_id)


def create_quotation(
    session: Session,
    *,
    customer_id: int,
    plan_id: int,
    status: model.QuotationStatus,
    valid_until: date,
    payment_terms: str | None,
    notes: str | None,
    tax_id: int | None,
    discount_code: str | None,
    product_lines: list[dict],
) -> model.Quotation:
    if session.get(model.Customer, customer_id) is None:
        raise UnknownCustomerError
    plan = session.get(model.Plan, plan_id)
    if plan is None:
        raise UnknownPlanError
    if not plan.is_active:
        raise ValueError("plan is inactive")

    tax = _get_tax(session, tax_id)
    source_lines = product_lines or [
        {
            "product_id": line.product_id,
            "quantity": line.quantity,
            "unit_price": line.unit_price,
            "description": None,
            "variant_id": None,
        }
        for line in plan.lines
    ]
    if not source_lines:
        raise ValueError("quotation must contain at least one product line")
    products.ensure_products_exist(
        session, [line["product_id"] for line in source_lines]
    )

    prepared_lines = []
    for source in source_lines:
        db_product = session.get(model.Product, source["product_id"])
        variant = _get_variant(session, source["variant_id"], source["product_id"])
        description = source.get("description") or db_product.name
        if variant is not None:
            description = f"{description} — {variant.attribute_name}: {variant.attribute_value}"
        amount = _money(source["unit_price"] * source["quantity"])
        rate = tax.rate if tax else Decimal("0.00")
        calculation_type = (
            tax.calculation_type
            if tax
            else model.TaxCalculationType.EXCLUSIVE
        )
        subtotal = _net_subtotal(amount, rate, calculation_type)
        prepared_lines.append(
            {
                "product_id": source["product_id"],
                "variant_id": variant.id if variant else None,
                "variant_price_adjustment": (
                    variant.price_adjustment if variant else Decimal("0.00")
                ),
                "variant_name_snapshot": (
                    f"{variant.attribute_name}: {variant.attribute_value}"
                    if variant
                    else None
                ),
                "description": description,
                "product_name_snapshot": db_product.name,
                "quantity": source["quantity"],
                "unit_price": source["unit_price"],
                "tax_rate": rate,
                "tax_calculation_type": calculation_type,
                "tax_amount": Decimal("0.00"),
                "discount_amount": Decimal("0.00"),
                "line_total": Decimal("0.00"),
                "subtotal": subtotal,
            }
        )

    _, savings = _quote_discount(
        session, discount_code, plan_id, prepared_lines
    )
    _allocate_discount(prepared_lines, savings)
    for line in prepared_lines:
        taxable = line["subtotal"] - line["discount_amount"]
        if line["tax_calculation_type"] == model.TaxCalculationType.INCLUSIVE:
            line["tax_amount"] = _money(taxable * line["tax_rate"] / Decimal("100"))
        else:
            line["tax_amount"] = _money(taxable * line["tax_rate"] / Decimal("100"))
        line["line_total"] = taxable + line["tax_amount"]

    subtotal = sum((line["subtotal"] for line in prepared_lines), Decimal("0.00"))
    tax_amount = sum((line["tax_amount"] for line in prepared_lines), Decimal("0.00"))
    discount_amount = sum(
        (line["discount_amount"] for line in prepared_lines), Decimal("0.00")
    )
    quotation = model.Quotation(
        quotation_number=f"TMP-{uuid4().hex}",
        customer_id=customer_id,
        plan_id=plan_id,
        status=status,
        valid_until=valid_until,
        payment_terms=payment_terms,
        notes=notes,
        tax_id=tax.id if tax else None,
        discount_code=discount_code,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=subtotal - discount_amount + tax_amount,
    )
    try:
        session.add(quotation)
        session.flush()
        for line in prepared_lines:
            line.pop("subtotal")
            session.add(model.QuotationLine(quotation_id=quotation.id, **line))
        quotation.quotation_number = f"QUO-{quotation.id:06d}"
        session.commit()
    except Exception:
        session.rollback()
        raise
    result = get_quotation(session, quotation.id)
    assert result is not None
    return result


def transition_quotation(
    session: Session,
    quotation: model.Quotation,
    target: model.QuotationStatus,
) -> model.Quotation:
    _expire_due_quotations(session, quotation_id=quotation.id)
    session.refresh(quotation)
    allowed = {
        model.QuotationStatus.DRAFT: {model.QuotationStatus.SENT},
        model.QuotationStatus.SENT: {
            model.QuotationStatus.ACCEPTED,
            model.QuotationStatus.REJECTED,
        },
    }
    if target not in allowed.get(quotation.status, set()):
        raise InvalidQuotationTransitionError(
            f"Cannot change quotation from {quotation.status.value} to {target.value}"
        )

    try:
        if target == model.QuotationStatus.ACCEPTED:
            quotation.subscription_id = _create_draft_subscription(session, quotation)
        quotation.status = target
        session.add(quotation)
        session.commit()
    except Exception:
        session.rollback()
        raise
    result = get_quotation(session, quotation.id)
    assert result is not None
    return result


def _create_draft_subscription(
    session: Session, quotation: model.Quotation
) -> int:
    plan = session.get(model.Plan, quotation.plan_id)
    if plan is None:
        raise UnknownPlanError
    if not plan.is_active:
        raise ValueError("plan is inactive")
    start_date = max(date.today(), plan.start_date)
    if plan.end_date is not None and plan.end_date < start_date:
        raise ValueError("plan has ended")
    db_subscription = model.Subscription(
        subscription_number=f"TMP-{uuid4().hex}",
        customer_id=quotation.customer_id,
        plan_id=quotation.plan_id,
        start_date=start_date,
        expiry_date=plan.end_date,
        next_billing_date=subscriptions.add_billing_interval(
            start_date, plan.billing_interval, plan.billing_interval_count
        ),
        payment_terms_days=_payment_terms_days(quotation.payment_terms),
        status=model.SubscriptionStatus.DRAFT,
    )
    session.add(db_subscription)
    session.flush()
    for quote_line in quotation.product_lines:
        subscription_line = model.SubscriptionLine(
            subscription_id=db_subscription.id,
            product_id=quote_line.product_id,
            quantity=quote_line.quantity,
            unit_price=quote_line.unit_price,
            tax_rate=quote_line.tax_rate,
        )
        session.add(subscription_line)
        session.flush()
        session.add(
            model.SubscriptionLineTax(
                subscription_line_id=subscription_line.id,
                tax_id=quotation.tax_id,
                tax_rate=quote_line.tax_rate,
                calculation_type=quote_line.tax_calculation_type,
            )
        )
        if quote_line.variant_id is not None:
            session.add(
                model.SubscriptionLineVariant(
                    subscription_line_id=subscription_line.id,
                    variant_id=quote_line.variant_id,
                    variant_name_snapshot=quote_line.variant_name_snapshot
                    or "Selected variant",
                    price_adjustment_snapshot=quote_line.variant_price_adjustment,
                )
            )
    db_subscription.subscription_number = f"SUB-{db_subscription.id:06d}"
    if quotation.discount_code:
        db_discount = discounts.get_discount_by_code(session, quotation.discount_code)
        if db_discount is not None:
            session.add(
                model.SubscriptionDiscount(
                    subscription_id=db_subscription.id,
                    discount_id=db_discount.id,
                )
            )
    session.flush()
    return db_subscription.id


def _quote_discount(
    session: Session,
    code: str | None,
    plan_id: int,
    lines: list[dict],
) -> tuple[int | None, Decimal]:
    if not code:
        return None, Decimal("0.00")
    db_discount = discounts.get_discount_by_code(session, code)
    if db_discount is None:
        raise IneligibleDiscountError("Discount code is invalid or inactive")
    eligible_lines = lines
    if db_discount.applicability == model.DiscountAppliesTo.PRODUCT_SPECIFIC:
        product_ids = discounts.product_ids_by_discount(session, [db_discount.id])[
            db_discount.id
        ]
        eligible_lines = [
            line for line in lines if line["product_id"] in product_ids
        ]
    for line in lines:
        line["_discount_eligible"] = line in eligible_lines
    eligible_subtotal = sum(
        (line["subtotal"] for line in eligible_lines), Decimal("0.00")
    )
    eligible_quantity = sum(line["quantity"] for line in eligible_lines)
    product_id = eligible_lines[0]["product_id"] if eligible_lines else None
    result = discounts.check_eligibility(
        session,
        code=code,
        purchase_amount=eligible_subtotal,
        quantity=eligible_quantity,
        product_id=product_id,
        plan_id=plan_id,
    )
    if not result["eligible"]:
        raise IneligibleDiscountError(result["message"])
    return db_discount.id, result["savings"]


def _allocate_discount(lines: list[dict], savings: Decimal) -> None:
    if not savings:
        return
    applicable = [
        line
        for line in lines
        if line.get("_discount_eligible", True) and line["subtotal"] > 0
    ]
    total = sum((line["subtotal"] for line in applicable), Decimal("0.00"))
    if total <= 0:
        return
    remaining = savings
    for index, line in enumerate(applicable):
        if index == len(applicable) - 1:
            amount = remaining
        else:
            amount = _money(savings * line["subtotal"] / total)
            amount = min(amount, line["subtotal"])
        line["discount_amount"] = amount
        remaining -= amount
    for line in lines:
        line.pop("_discount_eligible", None)


def _get_tax(session: Session, tax_id: int | None) -> model.Tax | None:
    if tax_id is None:
        return session.exec(
            select(model.Tax).where(
                model.Tax.is_active == True,  # noqa: E712
                model.Tax.is_default == True,  # noqa: E712
            )
        ).first()
    tax = session.get(model.Tax, tax_id)
    if tax is None or not tax.is_active:
        raise UnknownTaxError
    return tax


def _get_variant(
    session: Session, variant_id: int | None, product_id: int
) -> model.ProductVariant | None:
    if variant_id is None:
        return None
    variant = session.get(model.ProductVariant, variant_id)
    if variant is None or variant.product_id != product_id:
        raise UnknownVariantError
    return variant


def _expire_due_quotations(
    session: Session, quotation_id: int | None = None
) -> None:
    statement = update(model.Quotation).where(
        model.Quotation.status.in_(
            (model.QuotationStatus.DRAFT, model.QuotationStatus.SENT)
        ),
        model.Quotation.valid_until < date.today(),
    )
    if quotation_id is not None:
        statement = statement.where(model.Quotation.id == quotation_id)
    result = session.exec(statement.values(status=model.QuotationStatus.EXPIRED))
    if result.rowcount:
        session.commit()


def _net_subtotal(
    amount: Decimal,
    rate: Decimal,
    calculation_type: model.TaxCalculationType,
) -> Decimal:
    if calculation_type == model.TaxCalculationType.INCLUSIVE and rate:
        return _money(amount / (Decimal("1") + rate / Decimal("100")))
    return amount


def _payment_terms_days(payment_terms: str | None) -> int:
    if not payment_terms:
        return 0
    match = re.search(r"\bnet\s+(\d+)\b", payment_terms, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)
