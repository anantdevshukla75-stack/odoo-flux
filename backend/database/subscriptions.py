import calendar
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from database import model, plans


class UnknownCustomerError(Exception):
    """Raised when the referenced customer does not exist."""


class UnknownPlanError(Exception):
    """Raised when the referenced plan does not exist."""


class EmptyPlanError(Exception):
    """Raised when a plan has no lines to snapshot."""


class InactivePlanError(Exception):
    """Raised when subscribing to an inactive plan."""


class ExpiredPlanError(Exception):
    """Raised when the plan ends before the subscription start date."""


class MinimumQuantityError(Exception):
    """Raised when a plan line is below the plan's minimum quantity."""

    def __init__(self, minimum: int, found: int):
        self.minimum = minimum
        self.found = found
        super().__init__(
            f"Quantity {found} is below the plan minimum of {minimum}"
        )


class InvalidTransitionError(Exception):
    """Raised when a status change is not allowed by the lifecycle."""

    def __init__(self, current: model.SubscriptionStatus, target):
        self.current = current
        self.target = target
        super().__init__(f"Cannot change status from {current.value} to {target}")


class PlanFlagError(Exception):
    """Raised when the plan disallows the requested status change."""


class RenewalNotAllowedError(Exception):
    """Raised when the subscription plan does not allow renewal."""


class RenewalAlreadyCreatedError(Exception):
    """Raised when the subscription has already been renewed."""


ALLOWED_TRANSITIONS = {
    model.SubscriptionStatus.DRAFT: {model.SubscriptionStatus.CONFIRMED},
    model.SubscriptionStatus.QUOTATION: {model.SubscriptionStatus.CONFIRMED},
    model.SubscriptionStatus.CONFIRMED: {
        model.SubscriptionStatus.ACTIVE,
        model.SubscriptionStatus.CLOSED,
    },
    model.SubscriptionStatus.ACTIVE: {
        model.SubscriptionStatus.PAUSED,
        model.SubscriptionStatus.CLOSED,
    },
    model.SubscriptionStatus.PAUSED: {
        model.SubscriptionStatus.ACTIVE,
        model.SubscriptionStatus.CLOSED,
    },
    model.SubscriptionStatus.CLOSED: set(),
}


def add_billing_interval(
    start: date, interval: model.BillingInterval, count: int
) -> date:
    if interval is model.BillingInterval.DAILY:
        return start + timedelta(days=count)

    if interval is model.BillingInterval.WEEKLY:
        return start + timedelta(weeks=count)

    if interval is model.BillingInterval.MONTHLY:
        return _add_months(start, count)

    return _add_months(start, 12 * count)


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])

    return date(year, month, day)


def _subscription_statement():
    return select(model.Subscription).options(
        selectinload(model.Subscription.lines)
    )


def get_subscription_by_id(
    session: Session, subscription_id: int
) -> model.Subscription | None:
    return session.exec(
        _subscription_statement().where(model.Subscription.id == subscription_id)
    ).first()


def list_subscriptions(
    session: Session,
    *,
    customer_id: int | None = None,
    status: model.SubscriptionStatus | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Subscription]:
    statement = _subscription_statement().order_by(
        model.Subscription.id.desc()
    )

    if customer_id is not None:
        statement = statement.where(
            model.Subscription.customer_id == customer_id
        )

    if status is not None:
        statement = statement.where(model.Subscription.status == status)

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def create_subscription(
    session: Session,
    *,
    customer_id: int,
    plan_id: int,
    start_date: date,
    payment_terms_days: int = 0,
) -> model.Subscription:
    if session.get(model.Customer, customer_id) is None:
        raise UnknownCustomerError

    db_plan = plans.get_plan_by_id(session, plan_id)

    if db_plan is None:
        raise UnknownPlanError

    if not db_plan.is_active:
        raise InactivePlanError

    if db_plan.end_date is not None and db_plan.end_date < start_date:
        raise ExpiredPlanError

    if not db_plan.lines:
        raise EmptyPlanError

    for line in db_plan.lines:
        if line.quantity < db_plan.minimum_quantity:
            raise MinimumQuantityError(db_plan.minimum_quantity, line.quantity)

    db_subscription = model.Subscription(
        # Temporary unique value so the row can be inserted before its id exists
        subscription_number=f"TMP-{uuid4().hex}",
        customer_id=customer_id,
        plan_id=plan_id,
        start_date=start_date,
        expiry_date=db_plan.end_date,
        next_billing_date=add_billing_interval(
            start_date, db_plan.billing_interval, db_plan.billing_interval_count
        ),
        payment_terms_days=payment_terms_days,
    )

    session.add(db_subscription)
    session.flush()

    default_tax = session.exec(
        select(model.Tax).where(
            model.Tax.is_active == True,  # noqa: E712
            model.Tax.is_default == True,  # noqa: E712
        )
    ).first()

    for line in db_plan.lines:
        subscription_line = model.SubscriptionLine(
            subscription_id=db_subscription.id,
            product_id=line.product_id,
            quantity=line.quantity,
            unit_price=line.unit_price,
            tax_rate=default_tax.rate if default_tax else Decimal("0.00"),
        )
        session.add(subscription_line)
        session.flush()
        session.add(
            model.SubscriptionLineTax(
                subscription_line_id=subscription_line.id,
                tax_id=default_tax.id if default_tax else None,
                tax_rate=default_tax.rate if default_tax else Decimal("0.00"),
                calculation_type=(
                    default_tax.calculation_type
                    if default_tax
                    else model.TaxCalculationType.EXCLUSIVE
                ),
            )
        )

    db_subscription.subscription_number = f"SUB-{db_subscription.id:06d}"

    session.commit()

    return _reload(session, db_subscription.id)


def update_subscription(
    session: Session, db_subscription: model.Subscription, changes: dict
) -> model.Subscription:
    for field, value in changes.items():
        setattr(db_subscription, field, value)

    session.add(db_subscription)
    session.commit()

    return _reload(session, db_subscription.id)


def transition(
    session: Session,
    db_subscription: model.Subscription,
    target: model.SubscriptionStatus,
) -> model.Subscription:
    allowed = ALLOWED_TRANSITIONS[db_subscription.status]

    if target not in allowed:
        raise InvalidTransitionError(db_subscription.status, target.value)

    db_plan = None
    if target in (
        model.SubscriptionStatus.PAUSED,
        model.SubscriptionStatus.CLOSED,
    ):
        db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)

    if target is model.SubscriptionStatus.PAUSED:
        if db_plan is None or not db_plan.allow_pause:
            raise PlanFlagError("This plan does not allow pausing")

    if (
        target is model.SubscriptionStatus.CLOSED
        and db_plan is not None
        and db_subscription.expiry_date is not None
        and db_subscription.expiry_date > date.today()
        and not db_plan.allow_early_close
    ):
        raise PlanFlagError("This plan does not allow early closure")

    db_subscription.status = target

    if target is model.SubscriptionStatus.CLOSED:
        db_subscription.next_billing_date = None

    session.add(db_subscription)
    session.commit()

    return _reload(session, db_subscription.id)


def renew_subscription(
    session: Session, db_subscription: model.Subscription
) -> model.Subscription:
    prior_renewal = session.get(
        model.SubscriptionRenewal, db_subscription.id
    )
    if prior_renewal is not None:
        raise RenewalAlreadyCreatedError
    if db_subscription.status != model.SubscriptionStatus.CLOSED:
        raise InvalidTransitionError(
            db_subscription.status, model.SubscriptionStatus.DRAFT.value
        )
    db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)
    if db_plan is None or not db_plan.allow_renewal:
        raise RenewalNotAllowedError("This plan does not allow renewal")

    renewal_start = (
        db_subscription.expiry_date + timedelta(days=1)
        if db_subscription.expiry_date is not None
        and db_subscription.expiry_date >= date.today()
        else date.today()
    )
    new_end_date = db_plan.end_date
    if new_end_date is not None and new_end_date < renewal_start:
        new_end_date = None
    renewed = model.Subscription(
        subscription_number=f"TMP-{uuid4().hex}",
        customer_id=db_subscription.customer_id,
        plan_id=db_subscription.plan_id,
        start_date=renewal_start,
        expiry_date=new_end_date,
        next_billing_date=add_billing_interval(
            renewal_start, db_plan.billing_interval, db_plan.billing_interval_count
        ),
        payment_terms_days=db_subscription.payment_terms_days,
    )
    try:
        session.add(renewed)
        session.flush()
        for old_line in db_subscription.lines:
            new_line = model.SubscriptionLine(
                subscription_id=renewed.id,
                product_id=old_line.product_id,
                quantity=old_line.quantity,
                unit_price=old_line.unit_price,
                tax_rate=old_line.tax_rate,
            )
            session.add(new_line)
            session.flush()
            tax_snapshot = session.get(model.SubscriptionLineTax, old_line.id)
            if tax_snapshot:
                session.add(
                    model.SubscriptionLineTax(
                        subscription_line_id=new_line.id,
                        tax_id=tax_snapshot.tax_id,
                        tax_rate=tax_snapshot.tax_rate,
                        calculation_type=tax_snapshot.calculation_type,
                    )
                )
            variant_snapshot = session.get(
                model.SubscriptionLineVariant, old_line.id
            )
            if variant_snapshot:
                session.add(
                    model.SubscriptionLineVariant(
                        subscription_line_id=new_line.id,
                        variant_id=variant_snapshot.variant_id,
                        variant_name_snapshot=variant_snapshot.variant_name_snapshot,
                        price_adjustment_snapshot=(
                            variant_snapshot.price_adjustment_snapshot
                        ),
                    )
                )
        renewed.subscription_number = f"SUB-{renewed.id:06d}"
        discount_link = session.get(
            model.SubscriptionDiscount, db_subscription.id
        )
        if discount_link:
            session.add(
                model.SubscriptionDiscount(
                    subscription_id=renewed.id,
                    discount_id=discount_link.discount_id,
                )
            )
        session.add(
            model.SubscriptionRenewal(
                source_subscription_id=db_subscription.id,
                renewed_subscription_id=renewed.id,
            )
        )
        session.commit()
    except Exception:
        session.rollback()
        raise
    return _reload(session, renewed.id)


def _reload(session: Session, subscription_id: int) -> model.Subscription:
    session.expire_all()

    db_subscription = get_subscription_by_id(session, subscription_id)

    assert db_subscription is not None
    return db_subscription
