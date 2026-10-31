import calendar
from datetime import date, timedelta
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

    for line in db_plan.lines:
        session.add(
            model.SubscriptionLine(
                subscription_id=db_subscription.id,
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
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

    if target is model.SubscriptionStatus.PAUSED:
        db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)

        if db_plan is None or not db_plan.allow_pause:
            raise PlanFlagError("This plan does not allow pausing")

    db_subscription.status = target

    if target is model.SubscriptionStatus.CLOSED:
        db_subscription.next_billing_date = None

    session.add(db_subscription)
    session.commit()

    return _reload(session, db_subscription.id)


def _reload(session: Session, subscription_id: int) -> model.Subscription:
    session.expire_all()

    db_subscription = get_subscription_by_id(session, subscription_id)

    assert db_subscription is not None
    return db_subscription
