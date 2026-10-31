from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import db, model, plans, products
from helpers import auth
from routes.schemas import plan

router = APIRouter()


@router.get("", response_model=list[plan.PlanResponse])
def list_plans(
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    return plans.list_plans(
        session, is_active=is_active, offset=offset, limit=limit
    )


@router.post("", response_model=plan.PlanResponse, status_code=201)
def create_plan(
    data: plan.PlanCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    payload = data.model_dump()
    lines = payload.pop("lines")

    try:
        return plans.create_plan(session, lines=lines, **payload)
    except products.UnknownProductError:
        raise HTTPException(
            status_code=400, detail="One or more products do not exist"
        )


@router.get("/{plan_id}", response_model=plan.PlanResponse)
def get_plan(
    plan_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_plan = plans.get_plan_by_id(session, plan_id)

    if db_plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    return db_plan


@router.patch("/{plan_id}", response_model=plan.PlanResponse)
def update_plan(
    plan_id: int,
    data: plan.PlanUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_plan = plans.get_plan_by_id(session, plan_id)

    if db_plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    payload = data.model_dump(exclude_unset=True)
    lines = payload.pop("lines", None)

    _check_dates(
        payload.get("start_date", db_plan.start_date),
        payload.get("end_date", db_plan.end_date),
    )

    if not payload and lines is None:
        return db_plan

    try:
        return plans.update_plan(
            session, db_plan, changes=payload, lines=lines
        )
    except products.UnknownProductError:
        raise HTTPException(
            status_code=400, detail="One or more products do not exist"
        )


def _check_dates(start_date: date, end_date: date | None) -> None:
    if end_date is not None and end_date < start_date:
        raise HTTPException(
            status_code=422, detail="end_date must be on or after start_date"
        )
