from decimal import Decimal

from sqlmodel import Session, select

from database import model


class UnknownProductError(Exception):
    """Raised when one or more product ids do not exist."""

    def __init__(self, product_ids: list[int]):
        self.product_ids = sorted(product_ids)
        super().__init__(f"Unknown product ids: {self.product_ids}")


def get_product_by_id(
    session: Session, product_id: int
) -> model.Product | None:
    return session.get(model.Product, product_id)


def list_products(
    session: Session,
    *,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Product]:
    statement = select(model.Product).order_by(model.Product.name)

    if is_active is not None:
        statement = statement.where(model.Product.is_active == is_active)

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def create_product(
    session: Session,
    *,
    name: str,
    product_type: model.ProductType,
    sales_price: Decimal,
    cost_price: Decimal,
    notes: str | None = None,
    is_active: bool = True,
) -> model.Product:
    db_product = model.Product(
        name=name,
        product_type=product_type,
        sales_price=sales_price,
        cost_price=cost_price,
        notes=notes,
        is_active=is_active,
    )

    session.add(db_product)
    session.commit()
    session.refresh(db_product)

    return db_product


def update_product(
    session: Session, db_product: model.Product, changes: dict
) -> model.Product:
    for field, value in changes.items():
        setattr(db_product, field, value)

    session.add(db_product)
    session.commit()
    session.refresh(db_product)

    return db_product


def ensure_products_exist(session: Session, product_ids: list[int]) -> None:
    """Raise UnknownProductError if any id is missing."""
    if not product_ids:
        return

    found = set(
        session.exec(
            select(model.Product.id).where(model.Product.id.in_(product_ids))
        ).all()
    )

    missing = sorted(set(product_ids) - found)

    if missing:
        raise UnknownProductError(missing)
