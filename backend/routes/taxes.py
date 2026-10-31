from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import db, model, taxes
from helpers import auth
from routes.schemas import tax

router = APIRouter()


@router.get("", response_model=list[tax.TaxResponse])
def list_taxes(
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    return taxes.list_taxes(
        session, is_active=is_active, offset=offset, limit=limit
    )


@router.post("", response_model=tax.TaxResponse, status_code=201)
def create_tax(
    data: tax.TaxCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    return taxes.create_tax(session, **data.model_dump())


@router.get("/{tax_id}", response_model=tax.TaxResponse)
def get_tax(
    tax_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_tax = taxes.get_tax(session, tax_id)
    if db_tax is None:
        raise HTTPException(status_code=404, detail="Tax not found")
    return db_tax


@router.patch("/{tax_id}", response_model=tax.TaxResponse)
def update_tax(
    tax_id: int,
    data: tax.TaxUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_tax = taxes.get_tax(session, tax_id)
    if db_tax is None:
        raise HTTPException(status_code=404, detail="Tax not found")
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return db_tax
    try:
        return taxes.update_tax(session, db_tax, changes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
