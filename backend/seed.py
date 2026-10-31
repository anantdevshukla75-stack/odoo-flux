"""
Seed the development database with demo accounts.

Usage:
    uv run python seed.py

This is a development helper only. Never use the demo password in production.
"""

from database import db, model
from database.auth import create_user, get_user_by_email
from helpers.auth import hash_password
from sqlmodel import Session

DEMO_PASSWORD = "Password123!"

DEMO_ACCOUNTS = [
    ("admin@odooflux.local", "Admin User", model.UserRole.ADMIN),
    ("staff@odooflux.local", "Staff User", model.UserRole.STAFF),
    ("customer@odooflux.local", "Customer User", model.UserRole.CUSTOMER),
]


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


def main() -> None:
    db.create_tables()

    with Session(db.engine) as session:
        for email, full_name, role in DEMO_ACCOUNTS:
            created = seed_account(session, email, full_name, role)
            print(f"{role.value:<8} {email:<28} {'created' if created else 'exists'}")

    print(f"\nDemo password for all accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
