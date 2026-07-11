# ENSO-Monsoon Analytics API — Backend

FastAPI backend serving pre-computed climate data and on-the-fly SQLite queries for the ENSO × Indian Monsoon dashboard.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (package manager)

## Setup

```bash
cd backend

# Install dependencies (creates .venv automatically)
uv sync
```

## Data Pipeline

Before starting the API, run the processing scripts to populate the database and pre-computed JSON files. **Scripts must be run in order** from the `backend/` directory:

```bash
# 1. Create SQLite tables
uv run python scripts/00_init_db.py

# 2. Parse ERSST v6 NetCDF → SST grids + ONI monthly table
uv run python scripts/01_parse_ersst.py

# 3. Parse OISST NetCDF → high-res SST grids
uv run python scripts/02_parse_oisst.py

# 4. Load CHIRPS rainfall GeoTIFF → daily_rainfall + rainfall_lpa tables
uv run python scripts/03_load_rainfall.py

# 5. Export ONI timeseries + phase summary JSON
uv run python scripts/04_compute_oni.py

# 6. Compute rainfall anomalies + cumulative JSONs
uv run python scripts/05_compute_rainfall_anomalies.py

# 7. Compute ONI-rainfall correlations
uv run python scripts/06_compute_correlations.py

# 8. Parse MODIS NDVI GeoTIFF → ndvi_regional table + JSONs
uv run python scripts/07_parse_ndvi.py
```

### Required Raw Data

Place these files in `../data/raw/` (relative to `backend/`):

| Directory | Expected Files |
|-----------|---------------|
| `raw/ersst/` | `ersst.v6.YYYYMM.nc` (monthly NetCDF files) |
| `raw/oisst/` | OISST daily mean `.nc` file |
| `raw/rainfall/` | `CHIRPS_India_Monthly_Rainfall_5km.tif` + `india_states.geojson` |
| `raw/ndvi/` | `MOD13A2_India_NDVI_48day_2000_2024.tif` |

## Running the Backend

```bash
uv run uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

## API Documentation

Interactive docs available when running:

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## API Endpoints

| Router | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| SST | `/api/sst/grid` | GET | SST grid for an event (ERSST or OISST) |
| ONI | `/api/oni/timeseries` | GET | Full ONI timeseries |
| ONI | `/api/oni/details` | GET | ONI derivation details for a date range |
| ONI | `/api/oni/phase-summary` | GET | Phase distribution for a date range |
| Rainfall | `/api/rainfall/anomaly` | GET | Seasonal rainfall anomaly by year |
| Rainfall | `/api/rainfall/cumulative` | GET | Cumulative rainfall for a state+year |
| Rainfall | `/api/rainfall/animation-frame` | GET | Per-state rainfall for one animation frame |
| Correlation | `/api/correlation/heatmap` | GET | State-level ONI-rainfall correlation grid |
| Correlation | `/api/correlation/scatter` | GET | Scatter data for a single state |
| NDVI | `/api/ndvi/regional` | GET | NDVI by region (Kharif season) |
| NDVI | `/api/ndvi/national` | GET | National NDVI aggregate |

## Configuration

Path resolution in `backend/config.py`:

```python
BASE_DIR = Path(__file__).resolve().parent.parent   # → backend/
PROJECT_ROOT = BASE_DIR.parent                      # → project root
DATA_DIR = PROJECT_ROOT / "data"                    # → project-root/data/
```

## Tests

```bash
uv run pytest tests/
```