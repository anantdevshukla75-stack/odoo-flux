from sqlalchemy.orm import selectinload
from sqlmodel import Session, delete, select

from database import model, products


class UnknownPlanError(Exception):
    """Raised when the template's default plan does not exist."""


class UnknownVariantError(Exception):
    """Raised when a line's variant does not belong to its product."""


def _template_statement():
    return select(model.QuotationTemplate).options(
        selectinload(model.QuotationTemplate.product_lines)
    )


def list_templates(
    session: Session, *, offset: int = 0, limit: int = 100
) -> list[model.QuotationTemplate]:
    statement = _template_statement().order_by(model.QuotationTemplate.name)
    return list(session.exec(statement.offset(offset).limit(limit)).all())


def get_template(
    session: Session, template_id: int
) -> model.QuotationTemplate | None:
    return session.exec(
        _template_statement().where(model.QuotationTemplate.id == template_id)
    ).first()


def create_template(
    session: Session,
    *,
    name: str,
    description: str | None,
    default_plan_id: int | None,
    validity_days: int,
    product_lines: list[dict],
) -> model.QuotationTemplate:
    _validate_template_references(
        session, default_plan_id=default_plan_id, product_lines=product_lines
    )
    template = model.QuotationTemplate(
        name=name,
        description=description,
        default_plan_id=default_plan_id,
        validity_days=validity_days,
    )
    try:
        session.add(template)
        session.flush()
        for line in product_lines:
            session.add(
                model.QuotationTemplateLine(template_id=template.id, **line)
            )
        session.commit()
    except Exception:
        session.rollback()
        raise
    result = get_template(session, template.id)
    assert result is not None
    return result


def update_template(
    session: Session,
    template: model.QuotationTemplate,
    *,
    changes: dict,
    product_lines: list[dict] | None,
) -> model.QuotationTemplate:
    merged_lines = (
        product_lines
        if product_lines is not None
        else [
            {
                "product_id": line.product_id,
                "variant_id": line.variant_id,
                "quantity": line.quantity,
                "unit_price": line.unit_price,
            }
            for line in template.product_lines
        ]
    )
    default_plan_id = changes.get("default_plan_id", template.default_plan_id)
    _validate_template_references(
        session, default_plan_id=default_plan_id, product_lines=merged_lines
    )
    try:
        for field, value in changes.items():
            setattr(template, field, value)
        session.add(template)
        if product_lines is not None:
            session.exec(
                delete(model.QuotationTemplateLine).where(
                    model.QuotationTemplateLine.template_id == template.id
                )
            )
            for line in product_lines:
                session.add(
                    model.QuotationTemplateLine(template_id=template.id, **line)
                )
        session.commit()
    except Exception:
        session.rollback()
        raise
    result = get_template(session, template.id)
    assert result is not None
    return result


def delete_template(session: Session, template: model.QuotationTemplate) -> None:
    session.delete(template)
    session.commit()


def _validate_template_references(
    session: Session,
    *,
    default_plan_id: int | None,
    product_lines: list[dict],
) -> None:
    if default_plan_id is not None and session.get(model.Plan, default_plan_id) is None:
        raise UnknownPlanError
    products.ensure_products_exist(
        session, [line["product_id"] for line in product_lines]
    )
    for line in product_lines:
        variant_id = line.get("variant_id")
        if variant_id is None:
            continue
        variant = session.get(model.ProductVariant, variant_id)
        if variant is None or variant.product_id != line["product_id"]:
            raise UnknownVariantError
