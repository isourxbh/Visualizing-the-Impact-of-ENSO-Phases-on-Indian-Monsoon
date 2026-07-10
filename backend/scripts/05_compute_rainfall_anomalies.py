import os
import sys
import json
import sqlite3
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import DB_PATH, PRECOMPUTED_DIR

def run():
    print("Running 05_compute_rainfall_anomalies...")
    anomaly_dir = PRECOMPUTED_DIR / "rainfall" / "anomaly"
    cumulative_dir = PRECOMPUTED_DIR / "rainfall" / "cumulative"
    anomaly_dir.mkdir(parents=True, exist_ok=True)
    cumulative_dir.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Anomaly per year
    for year in range(2009, 2025):
        # JJAS rainfall (June, July, August, September)
        # Note: we stored dates like 'YYYY-06-01'
        rows = cursor.execute(f"""
            SELECT r.state, SUM(r.rainfall_mm) as actual_mm, SUM(l.lpa_mm) as lpa_mm
            FROM daily_rainfall r
            JOIN rainfall_lpa l ON r.state = l.state AND l.month = CAST(strftime('%m', r.date) AS INTEGER)
            WHERE r.date >= '{year}-06-01' AND r.date <= '{year}-09-31'
            GROUP BY r.state
        """).fetchall()
        
        states_data = []
        for r in rows:
            actual = r['actual_mm']
            lpa = r['lpa_mm']
            if lpa > 0:
                dev = ((actual - lpa) / lpa) * 100
            else:
                dev = 0
            states_data.append({
                "state": r['state'],
                "actual_mm": round(actual, 2),
                "lpa_mm": round(lpa, 2),
                "deviation_pct": round(dev, 2)
            })
            
        with open(anomaly_dir / f"{year}.json", "w") as f:
            json.dump({
                "year": year,
                "season": "JJAS",
                "states": states_data
            }, f)
            
        # 2. Cumulative per state per year (June to Oct)
        states = cursor.execute("SELECT DISTINCT state FROM daily_rainfall").fetchall()
        for s in states:
            state = s['state']
            daily_rows = cursor.execute(f"""
                SELECT date, rainfall_mm
                FROM daily_rainfall
                WHERE state = ? AND date >= '{year}-06-01' AND date <= '{year}-10-31'
                ORDER BY date
            """, (state,)).fetchall()
            
            daily_data = []
            cum = 0
            for dr in daily_rows:
                cum += dr['rainfall_mm']
                daily_data.append({
                    "date": dr['date'],
                    "daily_mm": round(dr['rainfall_mm'], 2),
                    "cumulative_mm": round(cum, 2)
                })
                
            with open(cumulative_dir / f"{state}_{year}.json", "w") as f:
                json.dump({
                    "state": state,
                    "year": year,
                    "daily": daily_data
                }, f)
                
    conn.close()
    print("Rainfall JSONs generated.")

if __name__ == "__main__":
    run()
