from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR

router = APIRouter()

@router.get("/heatmap")
def get_heatmap():
    path = PRECOMPUTED_DIR / "correlation" / "heatmap.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Correlation heatmap not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/scatter")
def get_scatter(state: str):
    path = PRECOMPUTED_DIR / "correlation" / "scatter" / f"{state}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Correlation scatter not found")
    with open(path, "r") as f:
        return json.load(f)
