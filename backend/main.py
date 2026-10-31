from fastapi import FastAPI
from config import settings
from routes import auth
from contextlib import asynccontextmanager
from database import db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Before start-up
    db.create_table()
    # Yield control back to FastAPI
    yield

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
def checkHealth():
    return {"success": "ok"}
