"""
Seed the development database with demo accounts and catalog data.

Usage:
    uv run python seed.py

This is a development helper only. Never use the demo password in production.
"""

from datetime import date
from decimal import Decimal

from sqlmodel import Session, select

from database import db, model
from database.auth import create_user, get_user_by_email
from database.invoices import create_invoice
from database.payments import create_payment
from database.plans import create_plan
from database.products import create_product
from database.subscriptions import create_subscription, transition
from helpers.auth import hash_password

DEMO_PASSWORD = "Password123!"

DEMO_ACCOUNTS = [
    ("admin@odooflux.local", "Admin User", model.UserRole.ADMIN),
    ("staff@odooflux.local", "Staff User", model.UserRole.STAFF),
    ("customer@odooflux.local", "Customer User", model.UserRole.CUSTOMER),
]

DEMO_PRODUCTS = [
    {
        "name": "Cloud Hosting",
        "product_type": model.ProductType.SERVICE,
        "sales_price": Decimal("49.00"),
        "cost_price": Decimal("12.00"),
        "notes": "Managed hosting with daily backups.",
    },
    {
        "name": "Priority Support",
        "product_type": model.ProductType.SUBSCRIPTION,
        "sales_price": Decimal("99.00"),
        "cost_price": Decimal("30.00"),
        "notes": "24/7 support with a 1-hour response target.",
    },
    {
        "name": "Onboarding Package",
        "product_type": model.ProductType.GOODS,
        "sales_price": Decimal("199.00"),
        "cost_price": Decimal("0.00"),
        "notes": "One-time setup and migration assistance.",
    },
]

DEMO_PLAN = {
    "name": "Starter Monthly",
    "description": "Hosting and priority support, billed monthly.",
    "billing_interval": model.BillingInterval.MONTHLY,
    "billing_interval_count": 1,
    "minimum_quantity": 1,
    "start_date": date(2026, 1, 1),
}

DEMO_SUBSCRIPTION = {
    "customer_email": "customer@odooflux.local",
    "plan_name": "Starter Monthly",
}


def seed_account(
    session: Session, email: str, full_name: str, role: model.UserRole
) -> bool:
    """Create an account if it does not already exist. Returns True if created."""
    if get_user_by_email(session, email) is not None:
        return False

    create_user(
        session,
        email=email,
        full_name=full_name,
        password_hash=hash_password(DEMO_PASSWORD),
        role=role,
    )

    return True


def seed_products(session: Session) -> dict[str, model.Product]:
    """Create missing demo products. Returns all demo products keyed by name."""
    products: dict[str, model.Product] = {}

    for data in DEMO_PRODUCTS:
        existing = session.exec(
            select(model.Product).where(model.Product.name == data["name"])
        ).first()

        if existing is None:
            existing = create_product(session, **data)
            print(f"product  {data['name']:<20} created")
        else:
            print(f"product  {data['name']:<20} exists")

        products[data["name"]] = existing

    return products


def seed_plan(
    session: Session, products: dict[str, model.Product]
) -> bool:
    """Create the demo plan if it does not already exist."""
    existing = session.exec(
        select(model.Plan).where(model.Plan.name == DEMO_PLAN["name"])
    ).first()

    if existing is not None:
        print(f"plan     {DEMO_PLAN['name']:<20} exists")
        return False

    lines = [
        {
            "product_id": products["Cloud Hosting"].id,
            "quantity": 1,
            "unit_price": products["Cloud Hosting"].sales_price,
        },
        {
            "product_id": products["Priority Support"].id,
            "quantity": 1,
            "unit_price": products["Priority Support"].sales_price,
        },
    ]

    create_plan(session, lines=lines, **DEMO_PLAN)
    print(f"plan     {DEMO_PLAN['name']:<20} created")

    return True


def seed_subscription(session: Session) -> bool:
    """Create and activate the demo subscription if it does not exist."""
    user = get_user_by_email(session, DEMO_SUBSCRIPTION["customer_email"])
    db_customer = (
        session.exec(
            select(model.Customer).where(model.Customer.user_id == user.id)
        ).first()
        if user is not None
        else None
    )
    db_plan = session.exec(
        select(model.Plan).where(model.Plan.name == DEMO_SUBSCRIPTION["plan_name"])
    ).first()

    if db_customer is None or db_plan is None:
        print("subscription skipped (demo customer or plan missing)")
        return False

    existing = session.exec(
        select(model.Subscription).where(
            model.Subscription.customer_id == db_customer.id
        )
    ).first()

    if existing is not None:
        print(f"subscription {existing.subscription_number:<12} exists")
        return False

    db_subscription = create_subscription(
        session,
        customer_id=db_customer.id,
        plan_id=db_plan.id,
        start_date=date.today(),
    )
    transition(
        session, db_subscription, model.SubscriptionStatus.CONFIRMED
    )
    transition(session, db_subscription, model.SubscriptionStatus.ACTIVE)

    print(f"subscription {db_subscription.subscription_number} created (active)")
    return True


def seed_invoice(session: Session) -> bool:
    """Create and pay the first demo invoice if it does not exist."""
    user = get_user_by_email(session, DEMO_SUBSCRIPTION["customer_email"])
    db_customer = (
        session.exec(
            select(model.Customer).where(model.Customer.user_id == user.id)
        ).first()
        if user is not None
        else None
    )
    db_subscription = (
        session.exec(
            select(model.Subscription).where(
                model.Subscription.customer_id == db_customer.id
            )
        ).first()
        if db_customer is not None
        else None
    )

    if db_subscription is None:
        print("invoice skipped (demo subscription missing)")
        return False

    existing = session.exec(
        select(model.Invoice).where(
            model.Invoice.subscription_id == db_subscription.id
        )
    ).first()

    if existing is not None:
        print(f"invoice  {existing.invoice_number:<12} exists")
        return False

    db_invoice = create_invoice(
        session, subscription_id=db_subscription.id
    )
    create_payment(
        session,
        invoice_id=db_invoice.id,
        payment_method=model.PaymentMethod.BANK_TRANSFER,
        amount=db_invoice.total_amount,
        reference="DEMO-PAYMENT",
    )

    print(f"invoice  {db_invoice.invoice_number:<12} created (paid)")
    return True


def main() -> None:
    db.create_tables()

    with Session(db.engine) as session:
        for email, full_name, role in DEMO_ACCOUNTS:
            created = seed_account(session, email, full_name, role)
            print(f"{role.value:<8} {email:<28} {'created' if created else 'exists'}")

        products = seed_products(session)
        seed_plan(session, products)
        seed_subscription(session)
        seed_invoice(session)

    print(f"\nDemo password for all accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
