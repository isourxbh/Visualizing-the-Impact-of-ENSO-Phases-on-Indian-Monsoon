from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR
from backend.database import get_db_connection

router = APIRouter()

@router.get("/anomaly")
def get_anomaly(year: int):
    path = PRECOMPUTED_DIR / "rainfall" / "anomaly" / f"{year}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Rainfall anomaly not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/cumulative")
def get_cumulative(state: str, year: int):
    path = PRECOMPUTED_DIR / "rainfall" / "cumulative" / f"{state}_{year}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Rainfall cumulative not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/animation-frame")
def get_animation_frame(year: int, start_date: str, end_date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("""
        SELECT state,
               SUM(rainfall_mm) as current_rain,
               (SELECT SUM(r2.rainfall_mm) FROM daily_rainfall r2
                WHERE r2.state = r.state AND r2.date BETWEEN ? AND ?)
               as cumulative_rain
        FROM daily_rainfall r
        WHERE r.date BETWEEN ? AND ?
        GROUP BY state
    """, (f"{year}-01-01", end_date, start_date, end_date)).fetchall()
    conn.close()
    return {"frame": [dict(r) for r in rows]}
