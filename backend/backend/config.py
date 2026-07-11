import os
from pathlib import Path

# Paths
# BASE_DIR is the backend/ package directory (contains main.py, routers/, etc.)
BASE_DIR = Path(__file__).resolve().parent.parent
# PROJECT_ROOT is the repository root (one level above the backend/ project)
PROJECT_ROOT = BASE_DIR.parent
# Data lives at the project root, not inside the backend package
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
DB_PATH = DATA_DIR / "db" / "climate.db"
PRECOMPUTED_DIR = DATA_DIR / "precomputed"

# Ensure directories exist
PRECOMPUTED_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "db").mkdir(parents=True, exist_ok=True)
