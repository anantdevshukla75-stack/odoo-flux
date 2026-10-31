from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from database import model, products

CENT = Decimal("0.01")


class DuplicateDiscountCodeError(Exception):
    """Raised when a discount code is already in use."""


class UnknownPlanError(Exception):
    """Raised when an eligible plan ID does not exist."""


class DiscountInUseError(Exception):
    """Raised when a discount with redemptions cannot be deleted."""


def list_discounts(
    session: Session,
    *,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Discount]:
    statement = select(model.Discount).order_by(model.Discount.name)
    if is_active is not None:
        statement = statement.where(model.Discount.is_active == is_active)
    return list(session.exec(statement.offset(offset).limit(limit)).all())


def get_discount(session: Session, discount_id: int) -> model.Discount | None:
    return session.get(model.Discount, discount_id)


def get_discount_by_code(session: Session, code: str) -> model.Discount | None:
    return session.exec(
        select(model.Discount).where(model.Discount.code == code.upper())
    ).first()


def product_ids_by_discount(
    session: Session, discount_ids: list[int]
) -> dict[int, list[int]]:
    result = {discount_id: [] for discount_id in discount_ids}
    if not discount_ids:
        return result

    links = session.exec(
        select(model.DiscountProduct)
        .where(model.DiscountProduct.discount_id.in_(discount_ids))
        .order_by(model.DiscountProduct.product_id)
    ).all()
    for link in links:
        result[link.discount_id].append(link.product_id)
    return result


def plan_ids_by_discount(
    session: Session, discount_ids: list[int]
) -> dict[int, list[int]]:
    result = {discount_id: [] for discount_id in discount_ids}
    if not discount_ids:
        return result

    links = session.exec(
        select(model.DiscountPlan)
        .where(model.DiscountPlan.discount_id.in_(discount_ids))
        .order_by(model.DiscountPlan.plan_id)
    ).all()
    for link in links:
        result[link.discount_id].append(link.plan_id)
    return result


def create_discount(
    session: Session,
    *,
    fields: dict,
    applicable_products: list[int],
    applicable_subscriptions: list[int],
) -> model.Discount:
    _validate_targets(session, applicable_products, applicable_subscriptions)
    db_discount = model.Discount(**fields)
    try:
        session.add(db_discount)
        session.flush()
        _replace_targets(
            session,
            db_discount.id,
            applicable_products,
            applicable_subscriptions,
        )
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if "discounts.code" in str(exc).lower():
            raise DuplicateDiscountCodeError from exc
        raise
    except Exception:
        session.rollback()
        raise
    session.refresh(db_discount)
    return db_discount


def update_discount(
    session: Session,
    db_discount: model.Discount,
    *,
    changes: dict,
    applicable_products: list[int],
    applicable_subscriptions: list[int],
) -> model.Discount:
    _validate_targets(session, applicable_products, applicable_subscriptions)
    try:
        for field, value in changes.items():
            setattr(db_discount, field, value)
        session.add(db_discount)
        _replace_targets(
            session,
            db_discount.id,
            applicable_products,
            applicable_subscriptions,
        )
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if "discounts.code" in str(exc).lower():
            raise DuplicateDiscountCodeError from exc
        raise
    except Exception:
        session.rollback()
        raise
    session.refresh(db_discount)
    return db_discount


def delete_discount(session: Session, db_discount: model.Discount) -> None:
    has_redemptions = session.exec(
        select(model.DiscountRedemption.id).where(
            model.DiscountRedemption.discount_id == db_discount.id
        )
    ).first()
    has_subscription_links = session.exec(
        select(model.SubscriptionDiscount.subscription_id).where(
            model.SubscriptionDiscount.discount_id == db_discount.id
        )
    ).first()
    if has_redemptions is not None or has_subscription_links is not None:
        raise DiscountInUseError

    try:
        for link in session.exec(
            select(model.DiscountProduct).where(
                model.DiscountProduct.discount_id == db_discount.id
            )
        ).all():
            session.delete(link)
        for link in session.exec(
            select(model.DiscountPlan).where(
                model.DiscountPlan.discount_id == db_discount.id
            )
        ).all():
            session.delete(link)
        session.delete(db_discount)
        session.commit()
    except Exception:
        session.rollback()
        raise


def check_eligibility(
    session: Session,
    *,
    code: str,
    purchase_amount: Decimal,
    quantity: int,
    product_id: int | None,
    plan_id: int | None,
    as_of: date | None = None,
) -> dict:
    final_total = _money(purchase_amount)
    result = {
        "eligible": False,
        "message": "Discount code is invalid or inactive",
        "savings": Decimal("0.00"),
        "final_total": final_total,
    }
    db_discount = get_discount_by_code(session, code)
    if db_discount is None or not db_discount.is_active:
        return result

    today = as_of or date.today()
    if today < db_discount.start_date or (
        db_discount.end_date is not None and today > db_discount.end_date
    ):
        result["message"] = "Discount is outside its valid date range"
        return result
    if (
        db_discount.usage_limit is not None
        and db_discount.redemptions_count >= db_discount.usage_limit
    ):
        result["message"] = "Discount usage limit has been reached"
        return result
    if (
        db_discount.min_purchase is not None
        and purchase_amount < db_discount.min_purchase
    ):
        result["message"] = "Purchase amount is below the discount minimum"
        return result
    if quantity < db_discount.min_quantity:
        result["message"] = "Quantity is below the discount minimum"
        return result

    if db_discount.applicability == model.DiscountAppliesTo.PRODUCT_SPECIFIC:
        targets = product_ids_by_discount(session, [db_discount.id])[db_discount.id]
        if product_id is None or product_id not in targets:
            result["message"] = "Discount does not apply to this product"
            return result
    elif db_discount.applicability == model.DiscountAppliesTo.SUBSCRIPTION_WIDE:
        targets = plan_ids_by_discount(session, [db_discount.id])[
            db_discount.id
        ]
        if targets and (plan_id is None or plan_id not in targets):
            result["message"] = "Discount does not apply to this subscription"
            return result

    if db_discount.discount_type == model.DiscountType.PERCENTAGE:
        savings = _money(purchase_amount * db_discount.value / Decimal("100"))
    else:
        savings = _money(db_discount.value)
    savings = min(savings, final_total)
    result.update(
        eligible=True,
        message="Discount is eligible",
        savings=savings,
        final_total=final_total - savings,
    )
    return result


def _validate_targets(
    session: Session,
    applicable_products: list[int],
    applicable_subscriptions: list[int],
) -> None:
    products.ensure_products_exist(session, applicable_products)
    if not applicable_subscriptions:
        return
    found = set(
        session.exec(
            select(model.Plan.id).where(
                model.Plan.id.in_(applicable_subscriptions)
            )
        ).all()
    )
    if found != set(applicable_subscriptions):
        raise UnknownPlanError


def _replace_targets(
    session: Session,
    discount_id: int,
    applicable_products: list[int],
    applicable_subscriptions: list[int],
) -> None:
    for link in session.exec(
        select(model.DiscountProduct).where(
            model.DiscountProduct.discount_id == discount_id
        )
    ).all():
        session.delete(link)
    for link in session.exec(
        select(model.DiscountPlan).where(
            model.DiscountPlan.discount_id == discount_id
        )
    ).all():
        session.delete(link)
    for product_id in applicable_products:
        session.add(
            model.DiscountProduct(discount_id=discount_id, product_id=product_id)
        )
    for plan_id in applicable_subscriptions:
        session.add(
            model.DiscountPlan(discount_id=discount_id, plan_id=plan_id)
        )


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)
