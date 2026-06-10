from fastapi import APIRouter
from preprocessing.realtime_engine import process_event
from preprocessing.config import THRESHOLD, ID_TO_SERVICE, UNKNOWN_ID
from model.model import load_model
import torch

router = APIRouter()
model = load_model()


def _build_prediction_response(logits):
    probabilities = torch.sigmoid(logits).detach().cpu().flatten().tolist()

    scored_services = []

    for service_id, probability in enumerate(probabilities):
        if service_id == UNKNOWN_ID:
            continue

        service_name = ID_TO_SERVICE.get(service_id)

        if service_name is None:
            continue

        scored_services.append({
            "service": service_name,
            "risk": float(probability)
        })

    risky_services = [item for item in scored_services if item["risk"] >= THRESHOLD]

    if not risky_services:
        risky_services = sorted(scored_services, key=lambda item: item["risk"], reverse=True)[:5]
    else:
        risky_services = sorted(risky_services, key=lambda item: item["risk"], reverse=True)[:5]

    return probabilities, risky_services

@router.post("/predict")
def predict(event: dict | list):

    seq = process_event(event)

    if seq is None:
        return {
            "status": "warming_up",
            "prediction": [],
            "top_services": []
        }

    with torch.no_grad():
        logits = model(seq)
        probs, top_services = _build_prediction_response(logits)

    return {
        "status": "ok",
        "prediction": probs,
        "top_services": top_services
    }