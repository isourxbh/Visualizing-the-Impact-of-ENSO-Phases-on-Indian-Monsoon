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

@router.get("/seasonal-heatmap")
def get_seasonal_heatmap(year: int):
    """Monthly rainfall anomaly (%) per state for a given year.
    Returns 12 months × N states grid for the seasonal heatmap."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get monthly totals per state for this year
    monthly_rows = cursor.execute("""
        SELECT state,
               CAST(strftime('%m', date) AS INTEGER) as month,
               SUM(rainfall_mm) as total_mm
        FROM daily_rainfall
        WHERE strftime('%Y', date) = ?
        GROUP BY state, month
        ORDER BY state, month
    """, (str(year),)).fetchall()

    # Get LPA per state per month
    lpa_rows = cursor.execute(
        "SELECT state, month, lpa_mm FROM rainfall_lpa"
    ).fetchall()
    conn.close()

    lpa_map: dict[str, dict[int, float]] = {}
    for r in lpa_rows:
        st = r["state"]
        if st not in lpa_map:
            lpa_map[st] = {}
        lpa_map[st][r["month"]] = r["lpa_mm"]

    actual_map: dict[str, dict[int, float]] = {}
    for r in monthly_rows:
        st = r["state"]
        if st not in actual_map:
            actual_map[st] = {}
        actual_map[st][r["month"]] = r["total_mm"]

    states = sorted(set(list(lpa_map.keys()) + list(actual_map.keys())))
    cells = []
    for row_idx, state in enumerate(states):
        for month in range(1, 13):
            actual = actual_map.get(state, {}).get(month, 0)
            lpa = lpa_map.get(state, {}).get(month, 0)
            anomaly_pct = ((actual - lpa) / lpa * 100) if lpa > 0 else 0
            cells.append({
                "row": row_idx,
                "col": month - 1,
                "value": round(anomaly_pct, 1),
            })

    return {
        "year": year,
        "rows": states,
        "cols": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "cells": cells,
    }

@router.get("/calendar")
def get_calendar(state: str, year: int):
    """Daily rainfall for a state during JJAS monsoon season (Jun 1 - Sep 30).
    Returns cells suitable for a calendar heatmap."""
    conn = get_db_connection()
    cursor = conn.cursor()
    start_date = f"{year}-06-01"
    end_date = f"{year}-09-30"
    rows = cursor.execute("""
        SELECT date, rainfall_mm
        FROM daily_rainfall
        WHERE state = ? AND date BETWEEN ? AND ?
        ORDER BY date
    """, (state, start_date, end_date)).fetchall()
    conn.close()

    cells = []
    for i, r in enumerate(rows):
        cells.append({
            "day": i,
            "weekIndex": i // 7,
            "weekday": i % 7,
            "date": r["date"],
            "rainfallMm": round(r["rainfall_mm"], 1),
        })

    import math
    weeks = math.ceil(len(cells) / 7) if cells else 0
    return {"state": state, "year": year, "weeks": weeks, "cells": cells}

@router.get("/onset")
def get_onset(year: int):
    """Monsoon onset day per state for a given year.
    Onset is defined as the first date after Jun 1 when trailing-7-day
    cumulative rainfall exceeds 20 mm."""
    conn = get_db_connection()
    cursor = conn.cursor()
    start_date = f"{year}-06-01"
    end_date = f"{year}-09-30"
    rows = cursor.execute("""
        SELECT state, date, rainfall_mm
        FROM daily_rainfall
        WHERE date BETWEEN ? AND ?
        ORDER BY state, date
    """, (start_date, end_date)).fetchall()
    conn.close()

    from collections import defaultdict
    from datetime import datetime, timedelta
    state_data: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for r in rows:
        state_data[r["state"]].append((r["date"], r["rainfall_mm"]))

    jun1 = datetime.strptime(start_date, "%Y-%m-%d")
    results = []
    for state, daily in state_data.items():
        onset_day = len(daily) - 1  # fallback: end of season
        cum = 0.0
        window: list[float] = []
        for i, (dt_str, mm) in enumerate(daily):
            window.append(mm)
            if len(window) > 7:
                window.pop(0)
            trailing = sum(window)
            if trailing >= 20.0:
                onset_day = i
                break
        results.append({
            "regionId": state,
            "regionName": state,
            "onsetDay": onset_day,
        })

    return {"year": year, "data": results}
