from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import customers, db, model
from helpers import auth
from routes.schemas import customer

router = APIRouter()


def _get_customer_or_404(session: Session, customer_id: int) -> model.Customer:
    db_customer = customers.get_customer_by_id(session, customer_id)

    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return db_customer


def _ensure_can_access(
    current_user: model.User, db_customer: model.Customer
) -> None:
    if current_user.role in (model.UserRole.ADMIN, model.UserRole.STAFF):
        return

    if db_customer.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own customer profile",
        )


@router.get("/me", response_model=customer.CustomerResponse)
def get_my_customer(
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_customer = customers.get_customer_by_user_id(session, current_user.id)

    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    return customer.CustomerResponse.from_customer(db_customer)


@router.get("", response_model=list[customer.CustomerResponse])
def list_customers(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    rows = customers.list_customers(session, offset=offset, limit=limit)

    return [customer.CustomerResponse.from_customer(row) for row in rows]


@router.get("/{customer_id}", response_model=customer.CustomerResponse)
def get_customer(
    customer_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_customer = _get_customer_or_404(session, customer_id)

    _ensure_can_access(current_user, db_customer)

    return customer.CustomerResponse.from_customer(db_customer)


@router.patch("/{customer_id}", response_model=customer.CustomerResponse)
def update_customer(
    customer_id: int,
    data: customer.CustomerUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_customer = _get_customer_or_404(session, customer_id)

    _ensure_can_access(current_user, db_customer)

    changes = data.model_dump(exclude_unset=True)

    if not changes:
        return customer.CustomerResponse.from_customer(db_customer)

    db_customer = customers.update_customer(session, db_customer, changes)

    return customer.CustomerResponse.from_customer(db_customer)
