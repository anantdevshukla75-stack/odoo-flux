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
from database.plans import create_plan
from database.products import create_product
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


def main() -> None:
    db.create_tables()

    with Session(db.engine) as session:
        for email, full_name, role in DEMO_ACCOUNTS:
            created = seed_account(session, email, full_name, role)
            print(f"{role.value:<8} {email:<28} {'created' if created else 'exists'}")

        products = seed_products(session)
        seed_plan(session, products)

    print(f"\nDemo password for all accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
