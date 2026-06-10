import torch
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "best_of_best.pth"

if not MODEL_PATH.exists():
	raise FileNotFoundError(f"Model checkpoint not found: {MODEL_PATH}")

ckpt = torch.load(MODEL_PATH, map_location="cpu")

SERVICE_TO_ID = ckpt["service_map"]
FEATURE_COLS = ckpt["feature_cols"]
THRESHOLD = ckpt["threshold"]

ID_TO_SERVICE = {v: k for k, v in SERVICE_TO_ID.items()}

NUM_NODES = len(SERVICE_TO_ID)
NUM_FEATURES = len(FEATURE_COLS)

# last node reserved for unknown
UNKNOWN_ID = NUM_NODES - 1
SEQ_LEN = 5
WINDOW = 60