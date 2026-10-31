from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from database import model


def get_customer_by_id(session: Session, customer_id: int) -> model.Customer | None:
    return session.exec(
        select(model.Customer)
        .where(model.Customer.id == customer_id)
        .options(selectinload(model.Customer.user))
    ).first()


def get_customer_by_user_id(
    session: Session, user_id: int
) -> model.Customer | None:
    return session.exec(
        select(model.Customer)
        .where(model.Customer.user_id == user_id)
        .options(selectinload(model.Customer.user))
    ).first()


def list_customers(
    session: Session, *, offset: int = 0, limit: int = 100
) -> list[model.Customer]:
    statement = (
        select(model.Customer)
        .options(selectinload(model.Customer.user))
        .order_by(model.Customer.id)
        .offset(offset)
        .limit(limit)
    )

    return list(session.exec(statement).all())


def update_customer(
    session: Session, db_customer: model.Customer, changes: dict
) -> model.Customer:
    for field, value in changes.items():
        setattr(db_customer, field, value)

    session.add(db_customer)
    session.commit()
    session.refresh(db_customer)

    return db_customer
