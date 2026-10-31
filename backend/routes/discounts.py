from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session

from database import db, discounts, model, products
from helpers import auth
from routes.schemas import discount

router = APIRouter()

_DISCOUNT_FIELDS = (
    "name",
    "code",
    "description",
    "discount_type",
    "value",
    "min_purchase",
    "min_quantity",
    "start_date",
    "end_date",
    "usage_limit",
    "applicability",
    "is_active",
)


def _to_response(
    db_discount: model.Discount,
    product_ids: list[int],
    plan_ids: list[int],
) -> discount.DiscountResponse:
    return discount.DiscountResponse(
        id=db_discount.id,
        name=db_discount.name,
        code=db_discount.code,
        description=db_discount.description,
        discount_type=db_discount.discount_type,
        value=db_discount.value,
        min_purchase=db_discount.min_purchase,
        min_quantity=db_discount.min_quantity,
        start_date=db_discount.start_date,
        end_date=db_discount.end_date,
        usage_limit=db_discount.usage_limit,
        redemptions_count=db_discount.redemptions_count,
        applicability=db_discount.applicability,
        applicable_products=product_ids,
        applicable_subscriptions=plan_ids,
        is_active=db_discount.is_active,
    )


def _response_for(session: Session, db_discount: model.Discount):
    product_ids = discounts.product_ids_by_discount(session, [db_discount.id])
    plan_ids = discounts.plan_ids_by_discount(
        session, [db_discount.id]
    )
    return _to_response(
        db_discount,
        product_ids.get(db_discount.id, []),
        plan_ids.get(db_discount.id, []),
    )


def _merged_discount(
    session: Session,
    db_discount: model.Discount,
    changes: dict,
) -> discount.DiscountCreate:
    product_ids = discounts.product_ids_by_discount(session, [db_discount.id])
    plan_ids = discounts.plan_ids_by_discount(
        session, [db_discount.id]
    )
    merged = {field: getattr(db_discount, field) for field in _DISCOUNT_FIELDS}
    merged.update(
        applicable_products=product_ids.get(db_discount.id, []),
        applicable_subscriptions=plan_ids.get(db_discount.id, []),
    )
    merged.update(changes)
    return discount.DiscountCreate.model_validate(merged)


@router.get("", response_model=list[discount.DiscountResponse])
def list_discounts(
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_discounts = discounts.list_discounts(
        session, is_active=is_active, offset=offset, limit=limit
    )
    ids = [item.id for item in db_discounts]
    product_ids = discounts.product_ids_by_discount(session, ids)
    plan_ids = discounts.plan_ids_by_discount(session, ids)
    return [
        _to_response(
            item,
            product_ids.get(item.id, []),
            plan_ids.get(item.id, []),
        )
        for item in db_discounts
    ]


@router.post("", response_model=discount.DiscountResponse, status_code=201)
def create_discount(
    data: discount.DiscountCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    payload = data.model_dump()
    applicable_products = payload.pop("applicable_products")
    applicable_subscriptions = payload.pop("applicable_subscriptions")
    try:
        db_discount = discounts.create_discount(
            session,
            fields=payload,
            applicable_products=applicable_products,
            applicable_subscriptions=applicable_subscriptions,
        )
    except products.UnknownProductError:
        raise HTTPException(
            status_code=400, detail="One or more products do not exist"
        )
    except discounts.UnknownPlanError:
        raise HTTPException(
            status_code=400, detail="One or more plans do not exist"
        )
    except discounts.DuplicateDiscountCodeError:
        raise HTTPException(status_code=409, detail="Discount code already exists")
    return _response_for(session, db_discount)


@router.post(
    "/eligibility", response_model=discount.DiscountEligibilityResponse
)
def check_discount_eligibility(
    data: discount.DiscountEligibilityRequest,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    return discounts.check_eligibility(session, **data.model_dump())


@router.get("/{discount_id}", response_model=discount.DiscountResponse)
def get_discount(
    discount_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_discount = discounts.get_discount(session, discount_id)
    if db_discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return _response_for(session, db_discount)


@router.patch("/{discount_id}", response_model=discount.DiscountResponse)
def update_discount(
    discount_id: int,
    data: discount.DiscountUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_discount = discounts.get_discount(session, discount_id)
    if db_discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return _response_for(session, db_discount)

    try:
        merged = _merged_discount(session, db_discount, changes)
        payload = merged.model_dump()
        applicable_products = payload.pop("applicable_products")
        applicable_subscriptions = payload.pop("applicable_subscriptions")
        db_discount = discounts.update_discount(
            session,
            db_discount,
            changes={field: payload[field] for field in _DISCOUNT_FIELDS},
            applicable_products=applicable_products,
            applicable_subscriptions=applicable_subscriptions,
        )
    except products.UnknownProductError:
        raise HTTPException(
            status_code=400, detail="One or more products do not exist"
        )
    except discounts.UnknownPlanError:
        raise HTTPException(
            status_code=400, detail="One or more plans do not exist"
        )
    except discounts.DuplicateDiscountCodeError:
        raise HTTPException(status_code=409, detail="Discount code already exists")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return _response_for(session, db_discount)


@router.delete("/{discount_id}", status_code=204)
def delete_discount(
    discount_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_discount = discounts.get_discount(session, discount_id)
    if db_discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    try:
        discounts.delete_discount(session, db_discount)
    except discounts.DiscountInUseError:
        raise HTTPException(
            status_code=409,
            detail="Discounts linked to subscriptions or redemptions cannot be deleted; deactivate it instead",
        )
    return Response(status_code=204)
