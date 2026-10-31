from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from uuid import uuid4

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from database import model, plans, products, subscriptions

CENT = Decimal("0.01")


class UnknownSubscriptionError(Exception):
    """Raised when the subscription to invoice does not exist."""


class SubscriptionNotBillableError(Exception):
    """Raised when a subscription is not in a billable status."""


class MissingBillingDateError(Exception):
    """Raised when a subscription has no next billing date."""


class EmptySubscriptionError(Exception):
    """Raised when a subscription has no lines to invoice."""


class DuplicateInvoiceError(Exception):
    """Raised when the billing period has already been invoiced."""

    def __init__(self, period_start: date):
        self.period_start = period_start
        super().__init__(
            f"An invoice already exists for the billing period starting {period_start}"
        )


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _invoice_statement():
    return select(model.Invoice).options(selectinload(model.Invoice.lines))


def get_invoice_by_id(session: Session, invoice_id: int) -> model.Invoice | None:
    return session.exec(
        _invoice_statement().where(model.Invoice.id == invoice_id)
    ).first()


def list_invoices(
    session: Session,
    *,
    customer_id: int | None = None,
    subscription_id: int | None = None,
    status: model.InvoiceStatus | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Invoice]:
    statement = _invoice_statement().order_by(model.Invoice.id.desc())

    if customer_id is not None:
        statement = statement.where(model.Invoice.customer_id == customer_id)

    if subscription_id is not None:
        statement = statement.where(
            model.Invoice.subscription_id == subscription_id
        )

    if status is not None:
        statement = statement.where(model.Invoice.status == status)

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def create_invoice(
    session: Session,
    *,
    subscription_id: int,
    issue_date: date | None = None,
) -> model.Invoice:
    db_subscription = subscriptions.get_subscription_by_id(
        session, subscription_id
    )

    if db_subscription is None:
        raise UnknownSubscriptionError

    if db_subscription.status not in (
        model.SubscriptionStatus.ACTIVE,
        model.SubscriptionStatus.CONFIRMED,
    ):
        raise SubscriptionNotBillableError

    if not db_subscription.lines:
        raise EmptySubscriptionError

    db_plan = plans.get_plan_by_id(session, db_subscription.plan_id)

    if db_plan is None:
        raise UnknownSubscriptionError

    has_invoices = session.exec(
        select(model.Invoice.id).where(
            model.Invoice.subscription_id == db_subscription.id
        )
    ).first() is not None

    if has_invoices:
        if db_subscription.next_billing_date is None:
            raise MissingBillingDateError

        period_start = db_subscription.next_billing_date
    else:
        # The first invoice covers the period the subscription was sold for
        period_start = db_subscription.start_date

    period_end = subscriptions.add_billing_interval(
        period_start,
        db_plan.billing_interval,
        db_plan.billing_interval_count,
    )

    duplicate = session.exec(
        select(model.Invoice.id).where(
            model.Invoice.subscription_id == db_subscription.id,
            model.Invoice.billing_period_start == period_start,
        )
    ).first()

    if duplicate is not None:
        raise DuplicateInvoiceError(period_start)

    invoice_date = issue_date or date.today()
    lines = _build_lines(session, db_subscription.lines)

    db_invoice = model.Invoice(
        # Temporary unique value so the row can be inserted before its id exists
        invoice_number=f"TMP-{uuid4().hex}",
        customer_id=db_subscription.customer_id,
        subscription_id=db_subscription.id,
        issue_date=invoice_date,
        due_date=invoice_date
        + timedelta(days=db_subscription.payment_terms_days),
        billing_period_start=period_start,
        billing_period_end=period_end,
        subtotal=sum((line["subtotal"] for line in lines), Decimal("0.00")),
        discount_amount=Decimal("0.00"),
        tax_amount=sum((line["tax_amount"] for line in lines), Decimal("0.00")),
        total_amount=sum((line["line_total"] for line in lines), Decimal("0.00")),
        # Generated invoices are immediately billable; drafts are reserved for
        # a future manual review step.
        status=model.InvoiceStatus.CONFIRMED,
    )

    session.add(db_invoice)
    session.flush()

    for line in lines:
        session.add(
            model.InvoiceLine(
                invoice_id=db_invoice.id,
                product_id=line["product_id"],
                description=line["description"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                discount_amount=Decimal("0.00"),
                tax_amount=line["tax_amount"],
                line_total=line["line_total"],
            )
        )

    db_invoice.invoice_number = f"INV-{db_invoice.id:06d}"
    db_subscription.next_billing_date = period_end

    session.add(db_subscription)
    session.commit()

    return _reload(session, db_invoice.id)


def generate_due_invoices(
    session: Session, *, as_of: date | None = None
) -> list[model.Invoice]:
    cutoff = as_of or date.today()

    billed_subscription_ids = select(model.Invoice.subscription_id)

    never_billed = session.exec(
        select(model.Subscription).where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE,
            model.Subscription.start_date <= cutoff,
            model.Subscription.id.not_in(billed_subscription_ids),
        )
    ).all()

    next_period_due = session.exec(
        select(model.Subscription).where(
            model.Subscription.status == model.SubscriptionStatus.ACTIVE,
            model.Subscription.next_billing_date.is_not(None),
            model.Subscription.next_billing_date <= cutoff,
        )
    ).all()

    due = {db_subscription.id: db_subscription for db_subscription in never_billed}
    due.update(
        {db_subscription.id: db_subscription for db_subscription in next_period_due}
    )

    created = []

    for db_subscription in due.values():
        try:
            created.append(
                create_invoice(session, subscription_id=db_subscription.id)
            )
        except DuplicateInvoiceError:
            # A manually rewound next billing date can point at a billed period
            continue

    return created


def _build_lines(
    session: Session, subscription_lines: list[model.SubscriptionLine]
) -> list[dict]:
    lines = []

    for line in subscription_lines:
        db_product = products.get_product_by_id(session, line.product_id)
        line_subtotal = _money(line.unit_price * line.quantity)
        tax_amount = _money(line_subtotal * line.tax_rate / Decimal("100"))

        lines.append(
            {
                "product_id": line.product_id,
                "description": (
                    db_product.name
                    if db_product is not None
                    else f"Product {line.product_id}"
                ),
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "tax_amount": tax_amount,
                "subtotal": line_subtotal,
                "line_total": line_subtotal + tax_amount,
            }
        )

    return lines


def _reload(session: Session, invoice_id: int) -> model.Invoice:
    session.expire_all()

    db_invoice = get_invoice_by_id(session, invoice_id)

    assert db_invoice is not None
    return db_invoice
