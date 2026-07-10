# Setup & Run

## Prerequisites

- [uv](https://docs.astral.sh/uv/) installed on your system

## Install Dependencies

This project uses `pyproject.toml` to manage dependencies. Install them with:

```bash
uv sync
```

This will create a virtual environment and install all dependencies listed in `pyproject.toml`.

## Running the Backend

Start the FastAPI server with:

```bash
uv run uvicorn backend.main:app --reload
```

The `--reload` flag enables auto-reload on code changes, useful for local development.

The API should now be running at `http://127.0.0.1:8000`.

## API Docs

Once running, interactive API docs are available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`