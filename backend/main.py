from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def checkHealth():
    return {"success": "ok"}

