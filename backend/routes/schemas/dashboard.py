from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    as_of: date
    active_subscriptions: int
    total_invoiced: Decimal
    total_collected: Decimal
    outstanding_amount: Decimal
    overdue_invoices: int
    overdue_amount: Decimal
