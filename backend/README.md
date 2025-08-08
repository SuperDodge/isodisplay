# IsoDisplay Backend (FastAPI)

Minimal backend to replace Base44 for **ContentItem**, **Playlist**, **Display**, and **DisplaySettings**.

## Quick start (SQLite for demo)
```bash
uvicorn app.main:app --reload
# Open http://127.0.0.1:8000/docs
```

## Production via Docker (with Postgres)
Set `DATABASE_URL` to a Postgres DSN such as:
```
postgresql+psycopg2://app:app@db:5432/isodisplay
```

## Environment
- `DATABASE_URL` (default: sqlite:///./isodisplay.db)
- `FRONTEND_ORIGIN` (CORS allowlist; default http://localhost:8080)

## Entities
- ContentItem
- Playlist (+ PlaylistItem link table)
- Display
- DisplaySettings (global singleton row keyed by id='default' out of the box)

This MVP creates DB tables on startup for simplicity. For production, replace with Alembic migrations.
