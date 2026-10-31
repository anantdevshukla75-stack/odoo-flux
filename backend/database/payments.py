from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func
from sqlmodel import Session, select

from database import model


class UnknownInvoiceError(Exception):
    """Raised when the invoice being paid does not exist."""


class InvoiceNotPayableError(Exception):
    """Raised when the invoice status does not accept payments."""


class AmountExceedsOutstandingError(Exception):
    """Raised when a payment is larger than the invoice balance."""

    def __init__(self, outstanding: Decimal):
        self.outstanding = outstanding
        super().__init__(
            f"Payment exceeds the outstanding amount of {outstanding}"
        )


def get_payment_by_id(session: Session, payment_id: int) -> model.Payment | None:
    return session.get(model.Payment, payment_id)


def list_payments(
    session: Session,
    *,
    invoice_id: int | None = None,
    customer_id: int | None = None,
    payment_method: model.PaymentMethod | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Payment]:
    statement = select(model.Payment).order_by(model.Payment.id.desc())

    if invoice_id is not None:
        statement = statement.where(model.Payment.invoice_id == invoice_id)

    if customer_id is not None:
        statement = statement.join(
            model.Invoice, model.Payment.invoice_id == model.Invoice.id
        ).where(model.Invoice.customer_id == customer_id)

    if payment_method is not None:
        statement = statement.where(
            model.Payment.payment_method == payment_method
        )

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def create_payment(
    session: Session,
    *,
    invoice_id: int,
    payment_method: model.PaymentMethod,
    amount: Decimal,
    payment_date: datetime | None = None,
    reference: str | None = None,
    note: str | None = None,
) -> model.Payment:
    db_invoice = session.get(model.Invoice, invoice_id)

    if db_invoice is None:
        raise UnknownInvoiceError

    if db_invoice.status not in (
        model.InvoiceStatus.CONFIRMED,
        model.InvoiceStatus.PARTIALLY_PAID,
    ):
        raise InvoiceNotPayableError

    paid = _amount_paid(session, invoice_id)
    outstanding = db_invoice.total_amount - paid

    if amount > outstanding:
        raise AmountExceedsOutstandingError(outstanding)

    db_payment = model.Payment(
        invoice_id=invoice_id,
        payment_method=payment_method,
        amount=amount,
        payment_date=payment_date or datetime.now(UTC),
        reference=reference,
        note=note,
    )

    session.add(db_payment)
    session.flush()

    db_invoice.status = (
        model.InvoiceStatus.PAID
        if amount >= outstanding
        else model.InvoiceStatus.PARTIALLY_PAID
    )
    session.add(db_invoice)

    session.commit()
    session.refresh(db_payment)

    return db_payment


def _amount_paid(session: Session, invoice_id: int) -> Decimal:
    total = session.exec(
        select(func.coalesce(func.sum(model.Payment.amount), 0)).where(
            model.Payment.invoice_id == invoice_id
        )
    ).one()

    return Decimal(str(total))
