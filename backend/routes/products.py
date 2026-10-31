from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import db, model, products
from helpers import auth
from routes.schemas import product

router = APIRouter()


@router.get("", response_model=list[product.ProductResponse])
def list_products(
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    return products.list_products(
        session, is_active=is_active, offset=offset, limit=limit
    )


@router.post("", response_model=product.ProductResponse, status_code=201)
def create_product(
    data: product.ProductCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    return products.create_product(session, **data.model_dump())


@router.get("/{product_id}", response_model=product.ProductResponse)
def get_product(
    product_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    db_product = products.get_product_by_id(session, product_id)

    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return db_product


@router.patch("/{product_id}", response_model=product.ProductResponse)
def update_product(
    product_id: int,
    data: product.ProductUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_product = products.get_product_by_id(session, product_id)

    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    changes = data.model_dump(exclude_unset=True)

    if not changes:
        return db_product

    return products.update_product(session, db_product, changes)
