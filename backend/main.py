from contextlib import asynccontextmanager

from database import db
from fastapi import FastAPI
from routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Before start-up
    db.create_tables()
    # Yield control back to FastAPI
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/health")
def health():
    return {"success": "ok"}
