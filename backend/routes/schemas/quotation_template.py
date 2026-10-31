from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class QuotationTemplateLineCreate(BaseModel):
    product_id: int = Field(gt=0)
    variant_id: int | None = Field(default=None, gt=0)
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(ge=0)


class QuotationTemplateLineResponse(QuotationTemplateLineCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class QuotationTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    default_plan_id: int | None = Field(default=None, gt=0)
    validity_days: int = Field(default=30, ge=1)
    product_lines: list[QuotationTemplateLineCreate] = Field(default_factory=list)


class QuotationTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    default_plan_id: int | None = Field(default=None, gt=0)
    validity_days: int | None = Field(default=None, ge=1)
    product_lines: list[QuotationTemplateLineCreate] | None = None

    @model_validator(mode="after")
    def reject_nulls_for_required_fields(self):
        for field in ("name", "validity_days", "product_lines"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class QuotationTemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None
    default_plan_id: int | None
    validity_days: int
    product_lines: list[QuotationTemplateLineResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
