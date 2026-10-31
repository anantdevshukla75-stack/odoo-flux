from sqlalchemy.engine import make_url
from sqlmodel import SQLModel, Session, create_engine

from config import settings

url = make_url(settings.DATABASE_URL)

engine_kwargs = {}
if url.drivername.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif url.drivername.startswith("postgresql"):
    # Neon and other managed Postgres endpoints usually require SSL.
    # Keep the URL as the source of truth; only add pool settings here.
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session