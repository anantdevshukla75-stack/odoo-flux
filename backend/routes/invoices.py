from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import customers, db, invoices, model
from helpers import auth
from routes.schemas import invoice

router = APIRouter()


def _own_customer_id(
    session: Session, current_user: model.User
) -> int | None:
    """Return the caller's customer id, or None for staff/admin."""
    if current_user.role in (model.UserRole.ADMIN, model.UserRole.STAFF):
        return None

    db_customer = customers.get_customer_by_user_id(session, current_user.id)

    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    return db_customer.id


@router.get("", response_model=list[invoice.InvoiceResponse])
def list_invoices(
    customer_id: int | None = Query(default=None),
    subscription_id: int | None = Query(default=None),
    status: model.InvoiceStatus | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    own_customer_id = _own_customer_id(session, current_user)

    if own_customer_id is not None:
        customer_id = own_customer_id

    return invoices.list_invoices(
        session,
        customer_id=customer_id,
        subscription_id=subscription_id,
        status=status,
        offset=offset,
        limit=limit,
    )


@router.get("/{invoice_id}", response_model=invoice.InvoiceResponse)
def get_invoice(
    invoice_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_invoice = invoices.get_invoice_by_id(session, invoice_id)

    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    own_customer_id = _own_customer_id(session, current_user)

    if own_customer_id is not None and db_invoice.customer_id != own_customer_id:
        raise HTTPException(
            status_code=403, detail="You can only access your own invoices"
        )

    return db_invoice
