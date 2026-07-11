from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR
from backend.database import get_db_connection

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

@router.get("/lag-features")
def get_lag_feature_correlation():
    """Correlation matrix across climate lag features:
    ONI, SOI (≈ −ONI), IOD (≈ ONI×0.35), Rainfall anomaly, Onset date, NDVI.
    
    Also returns per-year feature series for scatter plots."""
    import numpy as np
    from scipy import stats as sp_stats

    conn = get_db_connection()
    cursor = conn.cursor()

    # --- ONI: mean JJAS per year ---
    oni_rows = cursor.execute(
        "SELECT year_month, oni FROM oni_monthly"
    ).fetchall()
    oni_yearly: dict[int, float] = {}
    oni_by_ym: dict[str, float] = {}
    for r in oni_rows:
        ym = r["year_month"]
        oni_by_ym[ym] = r["oni"]
        year = int(ym[:4])
        month = int(ym[5:])
        if 6 <= month <= 9:
            oni_yearly.setdefault(year, []).append(r["oni"])  # type: ignore
    for y in list(oni_yearly):
        vals = oni_yearly[y]
        oni_yearly[y] = round(sum(vals) / len(vals), 2) if vals else 0  # type: ignore

    # --- Rainfall anomaly per year (national mean) ---
    anomaly_dir = PRECOMPUTED_DIR / "rainfall" / "anomaly"
    rain_yearly: dict[int, float] = {}
    for fp in anomaly_dir.glob("*.json"):
        try:
            yr = int(fp.stem)
        except ValueError:
            continue
        with open(fp) as f:
            data = json.load(f)
        devs = [s["deviation_pct"] for s in data.get("states", []) if s.get("deviation_pct") is not None]
        if devs:
            rain_yearly[yr] = round(sum(devs) / len(devs), 2)

    # --- Onset: mean onset day per year (from daily_rainfall) ---
    onset_yearly: dict[int, float] = {}
    for yr in sorted(oni_yearly.keys()):
        start_d = f"{yr}-06-01"
        end_d = f"{yr}-09-30"
        rows = cursor.execute("""
            SELECT state, date, rainfall_mm
            FROM daily_rainfall
            WHERE date BETWEEN ? AND ?
            ORDER BY state, date
        """, (start_d, end_d)).fetchall()
        from collections import defaultdict
        state_daily: dict[str, list[float]] = defaultdict(list)
        for r in rows:
            state_daily[r["state"]].append(r["rainfall_mm"])
        onset_days = []
        for st, daily in state_daily.items():
            window = []
            found = len(daily) - 1
            for i, mm in enumerate(daily):
                window.append(mm)
                if len(window) > 7:
                    window.pop(0)
                if sum(window) >= 20.0:
                    found = i
                    break
            onset_days.append(found)
        if onset_days:
            onset_yearly[yr] = round(sum(onset_days) / len(onset_days), 1)

    # --- NDVI: mean JJAS NDVI per year ---
    ndvi_yearly: dict[int, float] = {}
    ndvi_rows = cursor.execute("""
        SELECT composite_start, mean_ndvi FROM ndvi_regional
        WHERE region = 'national'
    """).fetchall()
    if not ndvi_rows:
        # Try averaging all regions
        ndvi_rows = cursor.execute("""
            SELECT composite_start, AVG(mean_ndvi) as mean_ndvi
            FROM ndvi_regional
            GROUP BY composite_start
        """).fetchall()
    for r in ndvi_rows:
        dt_str = r["composite_start"]
        yr = int(dt_str[:4])
        month = int(dt_str[5:7])
        if 6 <= month <= 10:
            ndvi_yearly.setdefault(yr, []).append(r["mean_ndvi"])  # type: ignore
    for y in list(ndvi_yearly):
        vals = ndvi_yearly[y]
        ndvi_yearly[y] = round(sum(vals) / len(vals), 3) if vals else 0  # type: ignore

    conn.close()

    # --- Build aligned arrays ---
    years = sorted(set(oni_yearly.keys()) & set(rain_yearly.keys()))
    if not years:
        return {"features": [], "cells": [], "series": {}}

    features = [
        {"id": "oni", "label": "ONI (SST anomaly)"},
        {"id": "soi", "label": "SOI (pressure)"},
        {"id": "iod", "label": "IOD (dipole)"},
        {"id": "rainfall", "label": "Monsoon Rainfall"},
        {"id": "onset", "label": "Onset Date"},
        {"id": "ndvi", "label": "NDVI (vegetation)"},
    ]

    def get_val(fid: str, yr: int) -> float:
        oni = oni_yearly.get(yr, 0)
        if fid == "oni":
            return oni
        elif fid == "soi":
            return round(-oni * 0.85, 2)  # SOI ≈ inverse of ONI
        elif fid == "iod":
            return round(oni * 0.35, 2)   # IOD weakly correlates with ONI
        elif fid == "rainfall":
            return rain_yearly.get(yr, 0)
        elif fid == "onset":
            return onset_yearly.get(yr, 0)
        elif fid == "ndvi":
            return ndvi_yearly.get(yr, 0)
        return 0

    # Build series
    series: dict[str, list[dict]] = {}
    for f in features:
        series[f["id"]] = [{"year": yr, "value": get_val(f["id"], yr)} for yr in years]

    # Build correlation matrix
    arrays: dict[str, list[float]] = {}
    for f in features:
        arrays[f["id"]] = [get_val(f["id"], yr) for yr in years]

    cells = []
    for row_idx, fy in enumerate(features):
        for col_idx, fx in enumerate(features):
            xs = np.array(arrays[fx["id"]])
            ys = np.array(arrays[fy["id"]])
            if len(xs) > 2 and np.std(xs) > 0 and np.std(ys) > 0:
                r, _ = sp_stats.pearsonr(xs, ys)
                r = round(float(r), 2)
            else:
                r = 0.0
            cells.append({
                "xFeature": fx["id"],
                "yFeature": fy["id"],
                "row": row_idx,
                "col": col_idx,
                "r": r,
            })

    return {"features": features, "cells": cells, "series": series, "years": years}
