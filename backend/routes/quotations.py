import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from config import settings
from database import customers, db, model, quotations
from helpers import auth
from helpers import email as email_service
from routes.schemas import quotation

router = APIRouter()
logger = logging.getLogger(__name__)


def _to_response(
    session: Session, db_quotation: model.Quotation
) -> quotation.QuotationResponse:
    customer = session.get(model.Customer, db_quotation.customer_id)
    customer_user = session.get(model.User, customer.user_id) if customer else None
    plan = session.get(model.Plan, db_quotation.plan_id)
    if customer is None or customer_user is None or plan is None:
        raise HTTPException(status_code=500, detail="Quotation references missing data")

    lines = [
        quotation.QuotationLineResponse(
            id=line.id,
            product_id=line.product_id,
            variant_id=line.variant_id,
            product_name=line.product_name_snapshot,
            description=line.description,
            variant_price_adjustment=line.variant_price_adjustment,
            quantity=line.quantity,
            unit_price=line.unit_price,
            tax_rate=line.tax_rate,
            tax_calculation_type=line.tax_calculation_type,
            tax_amount=line.tax_amount,
            discount_amount=line.discount_amount,
            line_total=line.line_total,
        )
        for line in db_quotation.product_lines
    ]
    return quotation.QuotationResponse(
        id=db_quotation.id,
        quotation_number=db_quotation.quotation_number,
        customer_id=db_quotation.customer_id,
        customer_name=customer.company_name or customer_user.full_name,
        customer_email=customer_user.email,
        customer_phone=customer.phone,
        plan_id=db_quotation.plan_id,
        plan_name=plan.name,
        plan_interval=plan.billing_interval,
        status=db_quotation.status,
        subtotal=db_quotation.subtotal,
        tax_amount=db_quotation.tax_amount,
        discount_amount=db_quotation.discount_amount,
        total_amount=db_quotation.total_amount,
        tax_id=db_quotation.tax_id,
        discount_code=db_quotation.discount_code,
        valid_until=db_quotation.valid_until,
        payment_terms=db_quotation.payment_terms,
        notes=db_quotation.notes,
        created_at=db_quotation.created_at,
        subscription_id=db_quotation.subscription_id,
        product_lines=lines,
    )


def _customer_scope(
    session: Session, current_user: model.User
) -> int | None:
    if current_user.role in (model.UserRole.ADMIN, model.UserRole.STAFF):
        return None
    customer = customers.get_customer_by_user_id(session, current_user.id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return customer.id


def _ensure_can_view(
    session: Session,
    current_user: model.User,
    db_quotation: model.Quotation,
) -> None:
    own_customer_id = _customer_scope(session, current_user)
    if own_customer_id is not None and own_customer_id != db_quotation.customer_id:
        raise HTTPException(
            status_code=403, detail="You can only access your own quotations"
        )


@router.get("", response_model=list[quotation.QuotationResponse])
def list_quotations(
    customer_id: int | None = Query(default=None),
    status: model.QuotationStatus | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    own_customer_id = _customer_scope(session, current_user)
    if own_customer_id is not None:
        customer_id = own_customer_id
    result = quotations.list_quotations(
        session,
        customer_id=customer_id,
        status=status,
        offset=offset,
        limit=limit,
    )
    return [_to_response(session, item) for item in result]


@router.post("", response_model=quotation.QuotationResponse, status_code=201)
def create_quotation(
    data: quotation.QuotationCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    payload = data.model_dump()
    product_lines = payload.pop("product_lines")
    requested_status = payload.pop("status")
    try:
        created = quotations.create_quotation(
            session,
            product_lines=product_lines,
            status=model.QuotationStatus.DRAFT,
            **payload,
        )
    except quotations.UnknownCustomerError:
        raise HTTPException(status_code=404, detail="Customer not found")
    except quotations.UnknownPlanError:
        raise HTTPException(status_code=404, detail="Plan not found")
    except quotations.UnknownTaxError:
        raise HTTPException(status_code=404, detail="Tax not found or inactive")
    except quotations.UnknownVariantError:
        raise HTTPException(status_code=400, detail="Variant does not belong to product")
    except quotations.IneligibleDiscountError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if requested_status == model.QuotationStatus.SENT:
        if email_service.is_configured():
            _send_quotation(session, created)
        else:
            logger.info("Quotation %s marked sent; SMTP is not configured", created.quotation_number)
        created = quotations.transition_quotation(
            session, created, model.QuotationStatus.SENT
        )
    return _to_response(session, created)


@router.get("/{quotation_id}", response_model=quotation.QuotationResponse)
def get_quotation(
    quotation_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_quotation = quotations.get_quotation_with_expiry(session, quotation_id)
    if db_quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    _ensure_can_view(session, current_user, db_quotation)
    return _to_response(session, db_quotation)


@router.patch("/{quotation_id}", response_model=quotation.QuotationResponse)
def update_quotation_status(
    quotation_id: int,
    data: quotation.QuotationStatusUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_quotation = quotations.get_quotation_with_expiry(session, quotation_id)
    if db_quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    _ensure_can_view(session, current_user, db_quotation)
    if current_user.role == model.UserRole.CUSTOMER and data.status not in (
        model.QuotationStatus.ACCEPTED,
        model.QuotationStatus.REJECTED,
    ):
        raise HTTPException(status_code=403, detail="Customers can only accept or reject")
    try:
        if data.status == model.QuotationStatus.SENT:
            if db_quotation.status != model.QuotationStatus.DRAFT:
                raise HTTPException(
                    status_code=409, detail="Only draft quotations can be sent"
                )
            if email_service.is_configured():
                _send_quotation(session, db_quotation)
            else:
                logger.info(
                    "Quotation %s marked sent; SMTP is not configured",
                    db_quotation.quotation_number,
                )
        result = quotations.transition_quotation(
            session, db_quotation, data.status
        )
    except quotations.InvalidQuotationTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except (quotations.UnknownPlanError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _to_response(session, result)


def _send_quotation(session: Session, db_quotation: model.Quotation) -> None:
    customer = session.get(model.Customer, db_quotation.customer_id)
    customer_user = session.get(model.User, customer.user_id) if customer else None
    if customer_user is None:
        raise HTTPException(status_code=404, detail="Quotation customer not found")
    quotation_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}/customer/quotations/{db_quotation.id}"
    )
    try:
        email_service.send_quotation(
            customer_user.email,
            db_quotation.quotation_number,
            quotation_url,
            db_quotation.valid_until.isoformat(),
            str(db_quotation.total_amount),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Quotation email delivery failed") from exc
