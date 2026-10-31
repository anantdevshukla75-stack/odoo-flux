from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from uuid import uuid4

from sqlalchemy import or_, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from database import discounts, model, plans, products, subscriptions

CENT = Decimal("0.01")


class UnknownSubscriptionError(Exception):
    """Raised when the subscription to invoice does not exist."""


class SubscriptionNotBillableError(Exception):
    """Raised when a subscription is not in a billable status."""


class MissingBillingDateError(Exception):
    """Raised when a subscription has no next billing date."""


class EmptySubscriptionError(Exception):
    """Raised when a subscription has no lines to invoice."""


class DuplicateInvoiceError(Exception):
    """Raised when the billing period has already been invoiced."""

    def __init__(self, period_start: date):
        self.period_start = period_start
        super().__init__(
            f"An invoice already exists for the billing period starting {period_start}"
        )


class DiscountQuotaExceededError(Exception):
    """Raised when a discount quota is exhausted during invoice creation."""


class InvalidInvoiceTransitionError(Exception):
    """Raised when an invoice cannot perform the requested lifecycle action."""


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _invoice_statement():
    return select(model.Invoice).options(selectinload(model.Invoice.lines))


def get_invoice_by_id(session: Session, invoice_id: int) -> model.Invoice | None:
    return session.exec(
        _invoice_statement().where(model.Invoice.id == invoice_id)
    ).first()


def list_invoices(
    session: Session,
    *,
    customer_id: int | None = None,
    subscription_id: int | None = None,
    status: model.InvoiceStatus | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Invoice]:
    statement = _invoice_statement().order_by(model.Invoice.id.desc())

    if customer_id is not None:
        statement = statement.where(model.Invoice.customer_id == customer_id)

    if subscription_id is not None:
        statement = statement.where(
            model.Invoice.subscription_id == subscription_id
        )

    if status is not None:
        statement = statement.where(model.Invoice.status == status)

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def confirm_invoice(session: Session, invoice: model.Invoice) -> model.Invoice:
    if invoice.status != model.InvoiceStatus.DRAFT:
        raise InvalidInvoiceTransitionError("Only draft invoices can be confirmed")
    invoice.status = model.InvoiceStatus.CONFIRMED
    session.add(invoice)
    session.commit()
    return _reload(session, invoice.id)


def cancel_invoice(session: Session, invoice: model.Invoice) -> model.Invoice:
    if invoice.status not in (
        model.InvoiceStatus.DRAFT,
        model.InvoiceStatus.CONFIRMED,
    ):
        raise InvalidInvoiceTransitionError(
            "Only unpaid draft or confirmed invoices can be cancelled"
        )
    has_payments = session.exec(
        select(model.Payment.id).where(model.Payment.invoice_id == invoice.id)
    ).first()
    if has_payments is not None:
        raise InvalidInvoiceTransitionError(
            "An invoice with payments cannot be cancelled"
        )
    invoice.status = model.InvoiceStatus.CANCELLED
    session.add(invoice)
    session.commit()
    return _reload(session, invoice.id)


def create_invoice(
    session: Session,
    *,
    subscription_id: int,
    issue_date: date | None = None,
) -> model.Invoice:
    db_subscription = subscriptions.get_subscription_by_id(
        session, subscription_id
    )

    if db_subscription is None:
        raise UnknownSubscriptionError

    if db_subscription.status not in (
        model.SubscriptionStatus.ACTIVE,
        model.SubscriptionStatus.CONFIRMED,
    ):
        raise SubscriptionNotBillableError

    if not db_subscription.lines:
        raise EmptySubscriptionError

    db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)

    if db_plan is None:
        raise UnknownSubscriptionError

    has_invoices = session.exec(
        select(model.Invoice.id).where(
            model.Invoice.subscription_id == db_subscription.id
        )
    ).first() is not None

    if has_invoices:
        if db_subscription.next_billing_date is None:
            raise MissingBillingDateError

        period_start = db_subscription.next_billing_date
    else:
        # The first invoice covers the period the subscription was sold for
        period_start = db_subscription.start_date

    period_end = subscriptions.add_billing_interval(
        period_start,
        db_plan.billing_interval,
        db_plan.billing_interval_count,
    )
    if db_subscription.expiry_date is not None:
        period_end = min(period_end, db_subscription.expiry_date)
    if period_end <= period_start:
        raise SubscriptionNotBillableError

    duplicate = session.exec(
        select(model.Invoice.id).where(
            model.Invoice.subscription_id == db_subscription.id,
            model.Invoice.billing_period_start == period_start,
        )
    ).first()

    if duplicate is not None:
        raise DuplicateInvoiceError(period_start)

    invoice_date = issue_date or date.today()
    lines = _build_lines(session, db_subscription.lines)
    applied_discount, eligible_line_indexes, savings = _best_discount(
        session,
        db_subscription,
        lines,
        as_of=invoice_date,
    )
    if applied_discount is not None and savings > 0:
        if not _reserve_discount(session, applied_discount.id):
            applied_discount = None
            eligible_line_indexes = set()
            savings = Decimal("0.00")
    else:
        applied_discount = None
        eligible_line_indexes = set()
        savings = Decimal("0.00")

    _allocate_discount(lines, eligible_line_indexes, savings)
    for line in lines:
        taxable = line["subtotal"] - line["discount_amount"]
        line["tax_amount"] = _money(taxable * line["tax_rate"] / Decimal("100"))
        line["line_total"] = taxable + line["tax_amount"]

    db_invoice = model.Invoice(
        # Temporary unique value so the row can be inserted before its id exists
        invoice_number=f"TMP-{uuid4().hex}",
        customer_id=db_subscription.customer_id,
        subscription_id=db_subscription.id,
        issue_date=invoice_date,
        due_date=invoice_date
        + timedelta(days=db_subscription.payment_terms_days),
        billing_period_start=period_start,
        billing_period_end=period_end,
        subtotal=sum((line["subtotal"] for line in lines), Decimal("0.00")),
        discount_amount=sum(
            (line["discount_amount"] for line in lines), Decimal("0.00")
        ),
        tax_amount=sum((line["tax_amount"] for line in lines), Decimal("0.00")),
        total_amount=sum((line["line_total"] for line in lines), Decimal("0.00")),
        # Generated invoices are immediately billable; drafts are reserved for
        # a future manual review step.
        status=model.InvoiceStatus.CONFIRMED,
    )

    try:
        session.add(db_invoice)
        session.flush()

        for line in lines:
            db_line = model.InvoiceLine(
                invoice_id=db_invoice.id,
                product_id=line["product_id"],
                description=line["description"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                discount_amount=line["discount_amount"],
                tax_amount=line["tax_amount"],
                line_total=line["line_total"],
            )
            session.add(db_line)
            session.flush()
            session.add(
                model.InvoiceLineSnapshot(
                    invoice_line_id=db_line.id,
                    variant_id=line["variant_id"],
                    variant_name_snapshot=line["variant_name"],
                    tax_id=line["tax_id"],
                    tax_rate=line["tax_rate"],
                    tax_calculation_type=line["tax_calculation_type"],
                )
            )

        db_invoice.invoice_number = f"INV-{db_invoice.id:06d}"
        session.add(
            model.InvoicePeriod(
                subscription_id=db_subscription.id,
                billing_period_start=period_start,
                billing_period_end=period_end,
                invoice_id=db_invoice.id,
            )
        )
        if applied_discount is not None:
            session.add(
                model.DiscountRedemption(
                    discount_id=applied_discount.id,
                    subscription_id=db_subscription.id,
                    invoice_id=db_invoice.id,
                )
            )
        db_subscription.next_billing_date = period_end
        session.add(db_subscription)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if "invoice_periods" in str(exc).lower():
            raise DuplicateInvoiceError(period_start) from exc
        raise
    except Exception:
        session.rollback()
        raise

    return _reload(session, db_invoice.id)


def generate_due_invoices(
    session: Session, *, as_of: date | None = None
) -> list[model.Invoice]:
    cutoff = as_of or date.today()

    billed_subscription_ids = select(model.Invoice.subscription_id)

    never_billed = session.exec(
        select(model.Subscription).where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE,
            model.Subscription.start_date <= cutoff,
            model.Subscription.id.not_in(billed_subscription_ids),
        )
    ).all()

    next_period_due = session.exec(
        select(model.Subscription).where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE,
            model.Subscription.next_billing_date.is_not(None),
            model.Subscription.next_billing_date <= cutoff,
        )
    ).all()

    expired_auto_close = session.exec(
        select(model.Subscription)
        .join(model.Plan, model.Plan.id == model.Subscription.plan_id)
        .where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE,
            model.Plan.auto_close == True,  # noqa: E712
            model.Subscription.expiry_date.is_not(None),
            model.Subscription.expiry_date <= cutoff,
        )
    ).all()

    due = {db_subscription.id: db_subscription for db_subscription in never_billed}
    due.update(
        {db_subscription.id: db_subscription for db_subscription in next_period_due}
    )
    due.update(
        {db_subscription.id: db_subscription for db_subscription in expired_auto_close}
    )

    created = []

    for db_subscription in due.values():
        db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)
        close_after_catch_up = bool(
            db_plan is not None
            and db_plan.auto_close
            and db_subscription.expiry_date is not None
            and db_subscription.expiry_date <= cutoff
        )

        while True:
            db_subscription = subscriptions.get_subscription_by_id(
                session, db_subscription.id
            )
            if db_subscription is None:
                break
            has_invoices = session.exec(
                select(model.Invoice.id).where(
                    model.Invoice.subscription_id == db_subscription.id
                )
            ).first() is not None
            period_start = (
                db_subscription.next_billing_date
                if has_invoices
                else db_subscription.start_date
            )
            if period_start is None or period_start > cutoff:
                break
            if (
                db_subscription.expiry_date is not None
                and period_start >= db_subscription.expiry_date
            ):
                break
            try:
                created.append(
                    create_invoice(
                        session,
                        subscription_id=db_subscription.id,
                        issue_date=cutoff,
                    )
                )
            except DuplicateInvoiceError:
                # A manually rewound date or another billing worker got there first.
                break
        if close_after_catch_up:
            db_subscription = subscriptions.get_subscription_by_id(
                session, db_subscription.id
            )
            if db_subscription is not None:
                db_subscription.status = model.SubscriptionStatus.CLOSED
                db_subscription.next_billing_date = None
                session.add(db_subscription)
                session.commit()

    return created


def _build_lines(
    session: Session, subscription_lines: list[model.SubscriptionLine]
) -> list[dict]:
    lines = []

    for line in subscription_lines:
        db_product = products.get_product_by_id(session, line.product_id)
        tax_snapshot = session.get(model.SubscriptionLineTax, line.id)
        if tax_snapshot is not None:
            tax_rate = tax_snapshot.tax_rate
            calculation_type = tax_snapshot.calculation_type
            tax_id = tax_snapshot.tax_id
        elif line.tax_rate:
            tax_rate = line.tax_rate
            calculation_type = model.TaxCalculationType.EXCLUSIVE
            tax_id = None
        else:
            default_tax = session.exec(
                select(model.Tax).where(
                    model.Tax.is_active == True,  # noqa: E712
                    model.Tax.is_default == True,  # noqa: E712
                )
            ).first()
            tax_rate = default_tax.rate if default_tax else Decimal("0.00")
            calculation_type = (
                default_tax.calculation_type
                if default_tax
                else model.TaxCalculationType.EXCLUSIVE
            )
            tax_id = default_tax.id if default_tax else None

        variant_snapshot = session.get(model.SubscriptionLineVariant, line.id)
        variant_name = (
            variant_snapshot.variant_name_snapshot if variant_snapshot else None
        )
        description = db_product.name if db_product else f"Product {line.product_id}"
        if variant_name:
            description = f"{description} — {variant_name}"

        gross = _money(line.unit_price * line.quantity)
        if calculation_type == model.TaxCalculationType.INCLUSIVE and tax_rate:
            line_subtotal = _money(
                gross / (Decimal("1") + tax_rate / Decimal("100"))
            )
        else:
            line_subtotal = gross
        tax_amount = _money(line_subtotal * tax_rate / Decimal("100"))

        lines.append(
            {
                "product_id": line.product_id,
                "description": description,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "tax_amount": tax_amount,
                "subtotal": line_subtotal,
                "line_total": line_subtotal + tax_amount,
                "discount_amount": Decimal("0.00"),
                "tax_rate": tax_rate,
                "tax_calculation_type": calculation_type,
                "tax_id": tax_id,
                "variant_id": (
                    variant_snapshot.variant_id if variant_snapshot else None
                ),
                "variant_name": variant_name,
            }
        )

    return lines


def _best_discount(
    session: Session,
    db_subscription: model.Subscription,
    lines: list[dict],
    *,
    as_of: date,
) -> tuple[model.Discount | None, set[int], Decimal]:
    linked = session.get(model.SubscriptionDiscount, db_subscription.id)
    candidates = (
        [session.get(model.Discount, linked.discount_id)]
        if linked is not None
        else discounts.list_discounts(session, is_active=True, offset=0, limit=500)
    )
    best_discount = None
    best_indexes: set[int] = set()
    best_savings = Decimal("0.00")

    for candidate in candidates:
        if candidate is None or not candidate.is_active:
            continue
        eligible_indexes = set(range(len(lines)))
        if candidate.applicability == model.DiscountAppliesTo.PRODUCT_SPECIFIC:
            product_ids = discounts.product_ids_by_discount(
                session, [candidate.id]
            )[candidate.id]
            eligible_indexes = {
                index
                for index, line in enumerate(lines)
                if line["product_id"] in product_ids
            }
        elif candidate.applicability == model.DiscountAppliesTo.SUBSCRIPTION_WIDE:
            plan_ids = discounts.plan_ids_by_discount(session, [candidate.id])[
                candidate.id
            ]
            if plan_ids and db_subscription.plan_id not in plan_ids:
                continue

        eligible_lines = [lines[index] for index in eligible_indexes]
        if not eligible_lines:
            continue
        purchase = sum(
            (line["subtotal"] for line in eligible_lines), Decimal("0.00")
        )
        quantity = sum(line["quantity"] for line in eligible_lines)
        first_product_id = (
            eligible_lines[0]["product_id"]
            if candidate.applicability == model.DiscountAppliesTo.PRODUCT_SPECIFIC
            else None
        )
        eligibility = discounts.check_eligibility(
            session,
            code=candidate.code,
            purchase_amount=purchase,
            quantity=quantity,
            product_id=first_product_id,
            plan_id=db_subscription.plan_id,
            as_of=as_of,
        )
        if eligibility["eligible"] and eligibility["savings"] > best_savings:
            best_discount = candidate
            best_indexes = eligible_indexes
            best_savings = eligibility["savings"]
    return best_discount, best_indexes, best_savings


def _allocate_discount(
    lines: list[dict], eligible_indexes: set[int], savings: Decimal
) -> None:
    if savings <= 0 or not eligible_indexes:
        return
    base = sum(
        (lines[index]["subtotal"] for index in eligible_indexes), Decimal("0.00")
    )
    remaining = savings
    indexes = sorted(eligible_indexes)
    for position, index in enumerate(indexes):
        line = lines[index]
        if position == len(indexes) - 1:
            amount = remaining
        else:
            amount = min(_money(savings * line["subtotal"] / base), line["subtotal"])
        line["discount_amount"] = amount
        remaining -= amount


def _reserve_discount(session: Session, discount_id: int) -> bool:
    statement = (
        update(model.Discount)
        .where(
            model.Discount.id == discount_id,
            model.Discount.is_active == True,  # noqa: E712
            or_(
                model.Discount.usage_limit.is_(None),
                model.Discount.redemptions_count < model.Discount.usage_limit,
            ),
        )
        .values(redemptions_count=model.Discount.redemptions_count + 1)
    )
    result = session.exec(statement)
    return result.rowcount == 1


def _reload(session: Session, invoice_id: int) -> model.Invoice:
    session.expire_all()

    db_invoice = get_invoice_by_id(session, invoice_id)

    assert db_invoice is not None
    return db_invoice
