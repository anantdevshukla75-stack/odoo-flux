from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from database import model


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    product_type: model.ProductType = model.ProductType.SERVICE
    sales_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(ge=0)
    notes: str | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    product_type: model.ProductType | None = None
    sales_price: Decimal | None = Field(default=None, ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def check_required_fields(self):
        # `notes` is the only column that can be cleared with null
        for field in (
            "name",
            "product_type",
            "sales_price",
            "cost_price",
            "is_active",
        ):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductVariantCreate(BaseModel):
    attribute_name: str = Field(min_length=1, max_length=255)
    attribute_value: str = Field(min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=100)
    price_adjustment: Decimal = Field(default=Decimal("0.00"))
    is_active: bool = True


class ProductVariantResponse(ProductVariantCreate):
    id: int
    product_id: int

    model_config = ConfigDict(from_attributes=True)


class ProductVariantUpdate(BaseModel):
    attribute_name: str | None = Field(default=None, min_length=1, max_length=255)
    attribute_value: str | None = Field(default=None, min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=100)
    price_adjustment: Decimal | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_nulls(self):
        for field in ("attribute_name", "attribute_value", "price_adjustment", "is_active"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self
