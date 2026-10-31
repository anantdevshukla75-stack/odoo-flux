from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import customers, db, model, subscriptions
from helpers import auth
from routes.schemas import subscription

router = APIRouter()


def _to_response(
    session: Session, db_subscription: model.Subscription
) -> subscription.SubscriptionResponse:
    lines = []
    for line in db_subscription.lines:
        tax_snapshot = session.get(model.SubscriptionLineTax, line.id)
        variant_snapshot = session.get(model.SubscriptionLineVariant, line.id)
        lines.append(
            subscription.SubscriptionLineResponse(
                id=line.id,
                product_id=line.product_id,
                variant_id=(
                    variant_snapshot.variant_id if variant_snapshot else None
                ),
                variant_name=(
                    variant_snapshot.variant_name_snapshot
                    if variant_snapshot
                    else None
                ),
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=(
                    tax_snapshot.tax_rate if tax_snapshot else line.tax_rate
                ),
                tax_calculation_type=(
                    tax_snapshot.calculation_type
                    if tax_snapshot
                    else model.TaxCalculationType.EXCLUSIVE
                ),
            )
        )
    return subscription.SubscriptionResponse(
        id=db_subscription.id,
        subscription_number=db_subscription.subscription_number,
        customer_id=db_subscription.customer_id,
        plan_id=db_subscription.plan_id,
        start_date=db_subscription.start_date,
        expiry_date=db_subscription.expiry_date,
        next_billing_date=db_subscription.next_billing_date,
        payment_terms_days=db_subscription.payment_terms_days,
        status=db_subscription.status,
        created_at=db_subscription.created_at,
        lines=lines,
    )


def _get_subscription_or_404(
    session: Session, subscription_id: int
) -> model.Subscription:
    db_subscription = subscriptions.get_subscription_by_id(
        session, subscription_id
    )

    if db_subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return db_subscription


def _ensure_can_view(
    session: Session,
    current_user: model.User,
    db_subscription: model.Subscription,
) -> None:
    if current_user.role in (model.UserRole.ADMIN, model.UserRole.STAFF):
        return

    db_customer = customers.get_customer_by_id(
        session, db_subscription.customer_id
    )

    if db_customer is None or db_customer.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own subscriptions",
        )


@router.get("", response_model=list[subscription.SubscriptionResponse])
def list_subscriptions(
    customer_id: int | None = Query(default=None),
    status: model.SubscriptionStatus | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    if current_user.role == model.UserRole.CUSTOMER:
        db_customer = customers.get_customer_by_user_id(session, current_user.id)

        if db_customer is None:
            raise HTTPException(
                status_code=404, detail="Customer profile not found"
            )

        # Customers only ever see their own subscriptions
        customer_id = db_customer.id

    results = subscriptions.list_subscriptions(
        session,
        customer_id=customer_id,
        status=status,
        offset=offset,
        limit=limit,
    )
    return [_to_response(session, result) for result in results]


@router.post("", response_model=subscription.SubscriptionResponse, status_code=201)
def create_subscription(
    data: subscription.SubscriptionCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    try:
        created = subscriptions.create_subscription(
            session, **data.model_dump()
        )
        return _to_response(session, created)
    except subscriptions.UnknownCustomerError:
        raise HTTPException(status_code=404, detail="Customer not found")
    except subscriptions.UnknownPlanError:
        raise HTTPException(status_code=404, detail="Plan not found")
    except subscriptions.InactivePlanError:
        raise HTTPException(status_code=400, detail="Plan is not active")
    except subscriptions.ExpiredPlanError:
        raise HTTPException(
            status_code=400,
            detail="Plan has ended before the subscription start date",
        )
    except subscriptions.EmptyPlanError:
        raise HTTPException(
            status_code=400, detail="Plan has no lines to subscribe to"
        )
    except subscriptions.MinimumQuantityError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{subscription_id}", response_model=subscription.SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)

    _ensure_can_view(session, current_user, db_subscription)

    return _to_response(session, db_subscription)


@router.patch(
    "/{subscription_id}", response_model=subscription.SubscriptionResponse
)
def update_subscription(
    subscription_id: int,
    data: subscription.SubscriptionUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)

    changes = data.model_dump(exclude_unset=True)

    expiry_date = changes.get("expiry_date", db_subscription.expiry_date)

    if expiry_date is not None and expiry_date < db_subscription.start_date:
        raise HTTPException(
            status_code=422,
            detail="expiry_date must be on or after start_date",
        )

    if not changes:
        return _to_response(session, db_subscription)

    updated = subscriptions.update_subscription(session, db_subscription, changes)
    return _to_response(session, updated)


def _apply_transition(
    session: Session,
    db_subscription: model.Subscription,
    target: model.SubscriptionStatus,
) -> model.Subscription:
    try:
        return subscriptions.transition(session, db_subscription, target)
    except subscriptions.InvalidTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except subscriptions.PlanFlagError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/{subscription_id}/confirm",
    response_model=subscription.SubscriptionResponse,
)
def confirm_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    return _to_response(
        session,
        _apply_transition(
            session,
            _get_subscription_or_404(session, subscription_id),
            model.SubscriptionStatus.CONFIRMED,
        ),
    )


@router.post(
    "/{subscription_id}/activate",
    response_model=subscription.SubscriptionResponse,
)
def activate_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)
    _ensure_can_view(session, current_user, db_subscription)
    if (
        current_user.role == model.UserRole.CUSTOMER
        and db_subscription.status != model.SubscriptionStatus.PAUSED
    ):
        raise HTTPException(
            status_code=403, detail="Customers can only resume paused subscriptions"
        )
    return _to_response(
        session,
        _apply_transition(
            session,
            db_subscription,
            model.SubscriptionStatus.ACTIVE,
        ),
    )


@router.post(
    "/{subscription_id}/pause",
    response_model=subscription.SubscriptionResponse,
)
def pause_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)
    _ensure_can_view(session, current_user, db_subscription)
    return _to_response(
        session,
        _apply_transition(
            session,
            db_subscription,
            model.SubscriptionStatus.PAUSED,
        ),
    )


@router.post(
    "/{subscription_id}/close",
    response_model=subscription.SubscriptionResponse,
)
def close_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)
    _ensure_can_view(session, current_user, db_subscription)
    return _to_response(
        session,
        _apply_transition(
            session,
            db_subscription,
            model.SubscriptionStatus.CLOSED,
        ),
    )


@router.post(
    "/{subscription_id}/renew",
    response_model=subscription.SubscriptionResponse,
    status_code=201,
)
def renew_subscription(
    subscription_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_subscription = _get_subscription_or_404(session, subscription_id)
    _ensure_can_view(session, current_user, db_subscription)
    try:
        renewed = subscriptions.renew_subscription(session, db_subscription)
    except subscriptions.RenewalNotAllowedError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except subscriptions.RenewalAlreadyCreatedError:
        raise HTTPException(
            status_code=409, detail="This subscription has already been renewed"
        )
    except subscriptions.InvalidTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return _to_response(session, renewed)
