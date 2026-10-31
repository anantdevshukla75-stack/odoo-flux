from decimal import Decimal

from sqlmodel import Session, select

from database import model


class VariantInUseError(Exception):
    """Raised when a variant is referenced by an immutable quote or invoice."""


def list_variants(session: Session, product_id: int) -> list[model.ProductVariant]:
    statement = (
        select(model.ProductVariant)
        .where(model.ProductVariant.product_id == product_id)
        .order_by(model.ProductVariant.id)
    )
    return list(session.exec(statement).all())


def get_variant(session: Session, variant_id: int) -> model.ProductVariant | None:
    return session.get(model.ProductVariant, variant_id)


def create_variant(
    session: Session,
    *,
    product_id: int,
    attribute_name: str,
    attribute_value: str,
    code: str | None,
    price_adjustment: Decimal,
    is_active: bool = True,
) -> model.ProductVariant:
    variant = model.ProductVariant(
        product_id=product_id,
        attribute_name=attribute_name,
        attribute_value=attribute_value,
        code=code,
        price_adjustment=price_adjustment,
        is_active=is_active,
    )
    session.add(variant)
    session.commit()
    session.refresh(variant)
    return variant


def update_variant(
    session: Session, variant: model.ProductVariant, changes: dict
) -> model.ProductVariant:
    for field, value in changes.items():
        setattr(variant, field, value)
    session.add(variant)
    session.commit()
    session.refresh(variant)
    return variant


def delete_variant(session: Session, variant: model.ProductVariant) -> None:
    references = (
        (model.QuotationTemplateLine, model.QuotationTemplateLine.variant_id),
        (model.QuotationLine, model.QuotationLine.variant_id),
        (model.SubscriptionLineVariant, model.SubscriptionLineVariant.variant_id),
        (model.InvoiceLineSnapshot, model.InvoiceLineSnapshot.variant_id),
    )
    for table, column in references:
        if session.exec(select(table).where(column == variant.id)).first() is not None:
            raise VariantInUseError
    session.delete(variant)
    session.commit()
