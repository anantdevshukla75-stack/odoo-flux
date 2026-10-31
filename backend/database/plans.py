from datetime import date

from sqlalchemy.orm import selectinload
from sqlmodel import Session, delete, select

from database import model, products


def _plan_statement():
    return select(model.Plan).options(selectinload(model.Plan.lines))


def get_plan_by_id(session: Session, plan_id: int) -> model.Plan | None:
    return session.exec(
        _plan_statement().where(model.Plan.id == plan_id)
    ).first()


def list_plans(
    session: Session,
    *,
    is_active: bool | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[model.Plan]:
    statement = _plan_statement().order_by(model.Plan.name)

    if is_active is not None:
        statement = statement.where(model.Plan.is_active == is_active)

    statement = statement.offset(offset).limit(limit)

    return list(session.exec(statement).all())


def create_plan(
    session: Session,
    *,
    name: str,
    billing_interval: model.BillingInterval,
    start_date: date,
    description: str | None = None,
    billing_interval_count: int = 1,
    minimum_quantity: int = 1,
    end_date: date | None = None,
    auto_close: bool = False,
    allow_early_close: bool = False,
    allow_pause: bool = False,
    allow_renewal: bool = False,
    is_active: bool = True,
    lines: list[dict],
) -> model.Plan:
    products.ensure_products_exist(
        session, [line["product_id"] for line in lines]
    )

    db_plan = model.Plan(
        name=name,
        description=description,
        billing_interval=billing_interval,
        billing_interval_count=billing_interval_count,
        minimum_quantity=minimum_quantity,
        start_date=start_date,
        end_date=end_date,
        auto_close=auto_close,
        allow_early_close=allow_early_close,
        allow_pause=allow_pause,
        allow_renewal=allow_renewal,
        is_active=is_active,
    )

    session.add(db_plan)
    session.flush()

    for line in lines:
        session.add(model.PlanLine(plan_id=db_plan.id, **line))

    session.commit()

    return _reload(session, db_plan.id)


def update_plan(
    session: Session,
    db_plan: model.Plan,
    *,
    changes: dict,
    lines: list[dict] | None,
) -> model.Plan:
    for field, value in changes.items():
        setattr(db_plan, field, value)

    session.add(db_plan)

    if lines is not None:
        products.ensure_products_exist(
            session, [line["product_id"] for line in lines]
        )

        session.exec(
            delete(model.PlanLine).where(model.PlanLine.plan_id == db_plan.id)
        )

        for line in lines:
            session.add(model.PlanLine(plan_id=db_plan.id, **line))

    session.commit()

    return _reload(session, db_plan.id)


def _reload(session: Session, plan_id: int) -> model.Plan:
    session.expire_all()

    db_plan = get_plan_by_id(session, plan_id)

    assert db_plan is not None
    return db_plan
