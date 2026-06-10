from fastapi import FastAPI

from api.routes import router as ml_router


app = FastAPI(title="PRISM ML Service")

app.include_router(ml_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "prism-ml-service",
    }