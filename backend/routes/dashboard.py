from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database import analytics, db, model
from helpers import auth
from routes.schemas import dashboard

router = APIRouter()


@router.get("/summary", response_model=dashboard.DashboardSummaryResponse)
def get_summary(
    as_of: date | None = Query(default=None),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_staff),
):
    return analytics.get_summary(session, as_of=as_of)
