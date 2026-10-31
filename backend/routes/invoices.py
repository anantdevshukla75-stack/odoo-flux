from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session

from database import customers, db, invoices, model, payments
from helpers import auth
from helpers import email as email_service
from helpers.invoice_pdf import render_invoice_pdf
from config import settings
from routes.schemas import invoice

router = APIRouter()


def to_response(
    session: Session, db_invoice: model.Invoice
) -> invoice.InvoiceResponse:
    lines = []
    for line in db_invoice.lines:
        snapshot = session.get(model.InvoiceLineSnapshot, line.id)
        lines.append(
            invoice.InvoiceLineResponse(
                id=line.id,
                product_id=line.product_id,
                description=line.description,
                variant_id=snapshot.variant_id if snapshot else None,
                variant_name=(
                    snapshot.variant_name_snapshot if snapshot else None
                ),
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=(snapshot.tax_rate if snapshot else Decimal("0.00")),
                tax_calculation_type=(
                    snapshot.tax_calculation_type
                    if snapshot
                    else model.TaxCalculationType.EXCLUSIVE
                ),
                discount_amount=line.discount_amount,
                tax_amount=line.tax_amount,
                line_total=line.line_total,
            )
        )
    return invoice.InvoiceResponse(
        id=db_invoice.id,
        invoice_number=db_invoice.invoice_number,
        customer_id=db_invoice.customer_id,
        subscription_id=db_invoice.subscription_id,
        issue_date=db_invoice.issue_date,
        due_date=db_invoice.due_date,
        billing_period_start=db_invoice.billing_period_start,
        billing_period_end=db_invoice.billing_period_end,
        subtotal=db_invoice.subtotal,
        discount_amount=db_invoice.discount_amount,
        tax_amount=db_invoice.tax_amount,
        total_amount=db_invoice.total_amount,
        status=db_invoice.status,
        created_at=db_invoice.created_at,
        lines=lines,
    )


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

    result = invoices.list_invoices(
        session,
        customer_id=customer_id,
        subscription_id=subscription_id,
        status=status,
        offset=offset,
        limit=limit,
    )
    return [to_response(session, db_invoice) for db_invoice in result]


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

    return to_response(session, db_invoice)


@router.get("/{invoice_id}/pdf", responses={200: {"content": {"application/pdf": {}}}})
def download_invoice_pdf(
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
            status_code=403, detail="You can only download your own invoices"
        )

    customer = customers.get_customer_by_id(session, db_invoice.customer_id)
    customer_user = session.get(model.User, customer.user_id) if customer else None
    if customer is None or customer_user is None:
        raise HTTPException(status_code=404, detail="Invoice customer not found")
    snapshots = {
        line.id: session.get(model.InvoiceLineSnapshot, line.id)
        for line in db_invoice.lines
    }
    invoice_payments = payments.list_payments(session, invoice_id=db_invoice.id)
    pdf = render_invoice_pdf(
        db_invoice, customer, customer_user, snapshots, invoice_payments
    )
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{db_invoice.invoice_number}.pdf"'
        },
    )


@router.post("/{invoice_id}/confirm", response_model=invoice.InvoiceResponse)
def confirm_invoice(
    invoice_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_invoice = invoices.get_invoice_by_id(session, invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        return to_response(session, invoices.confirm_invoice(session, db_invoice))
    except invoices.InvalidInvoiceTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/{invoice_id}/cancel", response_model=invoice.InvoiceResponse)
def cancel_invoice(
    invoice_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_invoice = invoices.get_invoice_by_id(session, invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        return to_response(session, invoices.cancel_invoice(session, db_invoice))
    except invoices.InvalidInvoiceTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/{invoice_id}/send", status_code=202)
def send_invoice(
    invoice_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    db_invoice = invoices.get_invoice_by_id(session, invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if db_invoice.status not in (
        model.InvoiceStatus.CONFIRMED,
        model.InvoiceStatus.PARTIALLY_PAID,
        model.InvoiceStatus.PAID,
    ):
        raise HTTPException(status_code=409, detail="Invoice is not ready to send")
    customer = customers.get_customer_by_id(session, db_invoice.customer_id)
    customer_user = session.get(model.User, customer.user_id) if customer else None
    if customer_user is None:
        raise HTTPException(status_code=404, detail="Invoice customer not found")
    if not email_service.is_configured():
        raise HTTPException(status_code=503, detail="SMTP email delivery is not configured")
    invoice_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}/customer/invoices/{db_invoice.id}"
    )
    try:
        email_service.send_invoice(
            customer_user.email, db_invoice.invoice_number, invoice_url
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Invoice email delivery failed") from exc
    return {"sent": True}
