import os

from alembic import context
from database import db, model
from sqlmodel import SQLModel

config = context.config
target_metadata = SQLModel.metadata

ADDITIVE_TABLES = {
    "product_variants",
    "quotation_templates",
    "quotation_template_lines",
    "taxes",
    "discounts",
    "discount_products",
    "discount_plans",
    "discount_redemptions",
    "quotations",
    "quotation_lines",
    "subscription_line_taxes",
    "subscription_line_variants",
    "subscription_discounts",
    "subscription_renewals",
    "invoice_periods",
    "invoice_line_snapshots",
}


def include_object(obj, name, type_, reflected, compare_to):
    if (
        os.environ.get("ALEMBIC_BASELINE_ONLY") == "1"
        and type_ == "table"
        and name in ADDITIVE_TABLES
    ):
        return False
    return True


def run_migrations_offline() -> None:
    from config import settings

    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_as_batch=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = db.engine
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
