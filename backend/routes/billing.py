from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import db, invoices, model
from helpers import auth
from routes.invoices import to_response
from routes.schemas import invoice

router = APIRouter()


@router.post("/generate", response_model=list[invoice.InvoiceResponse])
def generate_invoices(
    data: invoice.BillingGenerate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    if data.subscription_id is None:
        generated = invoices.generate_due_invoices(session, as_of=data.as_of)
        return [to_response(session, item) for item in generated]

    try:
        generated = [
            invoices.create_invoice(
                session,
                subscription_id=data.subscription_id,
                issue_date=data.as_of,
            )
        ]
        return [to_response(session, item) for item in generated]
    except invoices.UnknownSubscriptionError:
        raise HTTPException(status_code=404, detail="Subscription not found")
    except invoices.SubscriptionNotBillableError:
        raise HTTPException(
            status_code=400,
            detail="Only active or confirmed subscriptions can be invoiced",
        )
    except invoices.EmptySubscriptionError:
        raise HTTPException(
            status_code=400, detail="Subscription has no lines to invoice"
        )
    except invoices.MissingBillingDateError:
        raise HTTPException(
            status_code=400, detail="Subscription has no next billing date"
        )
    except invoices.DuplicateInvoiceError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
