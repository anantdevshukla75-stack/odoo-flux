from decimal import Decimal

from sqlalchemy import update
from sqlmodel import Session, select

from database import model


def list_taxes(
    session: Session,
    *,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Tax]:
    statement = select(model.Tax).order_by(model.Tax.name)
    if is_active is not None:
        statement = statement.where(model.Tax.is_active == is_active)
    return list(session.exec(statement.offset(offset).limit(limit)).all())


def get_tax(session: Session, tax_id: int) -> model.Tax | None:
    return session.get(model.Tax, tax_id)


def create_tax(
    session: Session,
    *,
    name: str,
    rate: Decimal,
    calculation_type: model.TaxCalculationType,
    is_default: bool,
    is_active: bool = True,
) -> model.Tax:
    tax = model.Tax(
        name=name,
        rate=rate,
        calculation_type=calculation_type,
        is_default=is_default,
        is_active=is_active,
    )
    try:
        if is_default:
            _clear_active_default(session)
        session.add(tax)
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(tax)
    return tax


def update_tax(session: Session, tax: model.Tax, changes: dict) -> model.Tax:
    is_default = changes.get("is_default", tax.is_default)
    is_active = changes.get("is_active", tax.is_active)
    if changes.get("is_default") is True and not is_active:
        raise ValueError("an inactive tax cannot be the default")
    if not is_active:
        is_default = False
        changes["is_default"] = False

    try:
        if is_default:
            _clear_active_default(session, except_id=tax.id)
        elif not is_active:
            tax.is_default = False
        for field, value in changes.items():
            setattr(tax, field, value)
        session.add(tax)
        session.commit()
    except Exception:
        session.rollback()
        raise
    session.refresh(tax)
    return tax


def _clear_active_default(session: Session, except_id: int | None = None) -> None:
    statement = update(model.Tax).where(
        model.Tax.is_active == True,  # noqa: E712
        model.Tax.is_default == True,  # noqa: E712
    )
    if except_id is not None:
        statement = statement.where(model.Tax.id != except_id)
    session.exec(statement.values(is_default=False))
