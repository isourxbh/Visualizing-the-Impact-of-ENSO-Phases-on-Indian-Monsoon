from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR

router = APIRouter()

@router.get("/grid")
def get_sst_grid(dataset: str = "ersst", event: str = "nov_2015"):
    path = PRECOMPUTED_DIR / "sst" / dataset / f"{event}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Grid data not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/grid-year")
def get_sst_grid_year(year: int):
    """Return the ERSST grid for a given year (November snapshot).
    Falls back to the closest available event if exact year not found."""
    dataset_dir = PRECOMPUTED_DIR / "sst" / "ersst"
    # Try exact year first
    exact = dataset_dir / f"nov_{year}.json"
    if exact.exists():
        with open(exact, "r") as f:
            return json.load(f)
    # Fall back to closest available event
    available = []
    if dataset_dir.exists():
        for p in dataset_dir.glob("nov_*.json"):
            try:
                y = int(p.stem.split("_")[1])
                available.append((abs(y - year), y, p))
            except (ValueError, IndexError):
                continue
    if not available:
        raise HTTPException(status_code=404, detail=f"No SST grid data available for year {year}")
    available.sort()
    closest_path = available[0][2]
    with open(closest_path, "r") as f:
        return json.load(f)
