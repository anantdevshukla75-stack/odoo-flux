from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import customers, db, model, payments
from helpers import auth
from routes.schemas import payment

router = APIRouter()


@router.get("", response_model=list[payment.PaymentResponse])
def list_payments(
    invoice_id: int | None = Query(default=None),
    payment_method: model.PaymentMethod | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    customer_id = None

    if current_user.role not in (model.UserRole.ADMIN, model.UserRole.STAFF):
        db_customer = customers.get_customer_by_user_id(session, current_user.id)

        if db_customer is None:
            raise HTTPException(
                status_code=404, detail="Customer profile not found"
            )

        customer_id = db_customer.id

    return payments.list_payments(
        session,
        invoice_id=invoice_id,
        customer_id=customer_id,
        payment_method=payment_method,
        offset=offset,
        limit=limit,
    )


@router.post("", response_model=payment.PaymentResponse, status_code=201)
def create_payment(
    data: payment.PaymentCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    try:
        return payments.create_payment(session, **data.model_dump())
    except payments.UnknownInvoiceError:
        raise HTTPException(status_code=404, detail="Invoice not found")
    except payments.InvoiceNotPayableError:
        raise HTTPException(
            status_code=400,
            detail="This invoice does not accept payments in its current status",
        )
    except payments.AmountExceedsOutstandingError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
