from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session

from database import db, model, products, quotation_templates
from helpers import auth
from routes.schemas import quotation_template

router = APIRouter()


def _translate_reference_error(error: Exception) -> HTTPException:
    if isinstance(error, products.UnknownProductError):
        return HTTPException(
            status_code=400, detail="One or more products do not exist"
        )
    if isinstance(error, quotation_templates.UnknownPlanError):
        return HTTPException(status_code=400, detail="Default plan does not exist")
    return HTTPException(status_code=400, detail="Variant does not belong to product")


@router.get("", response_model=list[quotation_template.QuotationTemplateResponse])
def list_templates(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    return quotation_templates.list_templates(session, offset=offset, limit=limit)


@router.post(
    "",
    response_model=quotation_template.QuotationTemplateResponse,
    status_code=201,
)
def create_template(
    data: quotation_template.QuotationTemplateCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    payload = data.model_dump()
    product_lines = payload.pop("product_lines")
    try:
        return quotation_templates.create_template(
            session, product_lines=product_lines, **payload
        )
    except (
        products.UnknownProductError,
        quotation_templates.UnknownPlanError,
        quotation_templates.UnknownVariantError,
    ) as exc:
        raise _translate_reference_error(exc)


@router.get(
    "/{template_id}", response_model=quotation_template.QuotationTemplateResponse
)
def get_template(
    template_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    template = quotation_templates.get_template(session, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    return template


@router.patch(
    "/{template_id}",
    response_model=quotation_template.QuotationTemplateResponse,
)
def update_template(
    template_id: int,
    data: quotation_template.QuotationTemplateUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    template = quotation_templates.get_template(session, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    payload = data.model_dump(exclude_unset=True)
    product_lines = payload.pop("product_lines", None)
    if not payload and product_lines is None:
        return template
    try:
        return quotation_templates.update_template(
            session, template, changes=payload, product_lines=product_lines
        )
    except (
        products.UnknownProductError,
        quotation_templates.UnknownPlanError,
        quotation_templates.UnknownVariantError,
    ) as exc:
        raise _translate_reference_error(exc)


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    template = quotation_templates.get_template(session, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Quotation template not found")
    quotation_templates.delete_template(session, template)
    return Response(status_code=204)
