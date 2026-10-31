from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from database import model


class TaxCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    rate: Decimal = Field(ge=0, le=100)
    calculation_type: model.TaxCalculationType = model.TaxCalculationType.EXCLUSIVE
    is_default: bool = False
    is_active: bool = True

    @model_validator(mode="after")
    def default_must_be_active(self):
        if self.is_default and not self.is_active:
            raise ValueError("an inactive tax cannot be the default")
        return self


class TaxUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    rate: Decimal | None = Field(default=None, ge=0, le=100)
    calculation_type: model.TaxCalculationType | None = None
    is_default: bool | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_nulls(self):
        for field in ("name", "rate", "calculation_type", "is_default", "is_active"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class TaxResponse(TaxCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
