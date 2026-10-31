from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from database import model

CENT = Decimal("0.01")

BILLABLE_STATUSES = (
    model.InvoiceStatus.CONFIRMED,
    model.InvoiceStatus.PARTIALLY_PAID,
    model.InvoiceStatus.PAID,
)

OUTSTANDING_STATUSES = (
    model.InvoiceStatus.CONFIRMED,
    model.InvoiceStatus.PARTIALLY_PAID,
)


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def get_summary(
    session: Session, *, as_of: date | None = None
) -> dict:
    """Return headline billing figures for the dashboard."""
    cutoff = as_of or date.today()

    active_subscriptions = session.exec(
        select(func.count(model.Subscription.id)).where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE
        )
    ).one()

    invoices = session.exec(
        select(model.Invoice)
        .options(selectinload(model.Invoice.payments))
        .where(model.Invoice.status.in_(BILLABLE_STATUSES))
    ).all()

    paid_by_invoice = {
        db_invoice.id: sum(
            (payment.amount for payment in db_invoice.payments),
            Decimal("0.00"),
        )
        for db_invoice in invoices
    }

    total_invoiced = sum(
        (db_invoice.total_amount for db_invoice in invoices), Decimal("0.00")
    )
    total_collected = sum(paid_by_invoice.values(), Decimal("0.00"))

    overdue = [
        db_invoice
        for db_invoice in invoices
        if db_invoice.status in OUTSTANDING_STATUSES
        and db_invoice.due_date < cutoff
        and paid_by_invoice[db_invoice.id] < db_invoice.total_amount
    ]

    overdue_amount = sum(
        (
            db_invoice.total_amount - paid_by_invoice[db_invoice.id]
            for db_invoice in overdue
        ),
        Decimal("0.00"),
    )

    return {
        "as_of": cutoff,
        "active_subscriptions": active_subscriptions,
        "total_invoiced": _money(total_invoiced),
        "total_collected": _money(total_collected),
        "outstanding_amount": _money(total_invoiced - total_collected),
        "overdue_invoices": len(overdue),
        "overdue_amount": _money(overdue_amount),
    }
