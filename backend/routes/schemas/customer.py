from datetime import datetime

from pydantic import BaseModel, Field

from database import model


class CustomerBase(BaseModel):
    company_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    billing_address: str | None = None
    tax_number: str | None = Field(default=None, max_length=50)


class CustomerUpdate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    user_id: int
    email: str
    full_name: str
    created_at: datetime

    @classmethod
    def from_customer(cls, customer: model.Customer) -> "CustomerResponse":
        return cls(
            id=customer.id,
            user_id=customer.user_id,
            email=customer.user.email,
            full_name=customer.user.full_name,
            company_name=customer.company_name,
            phone=customer.phone,
            billing_address=customer.billing_address,
            tax_number=customer.tax_number,
            created_at=customer.created_at,
        )
