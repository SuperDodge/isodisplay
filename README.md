# IsoDisplay App (Monorepo)

Frontend (Vite/Nginx) + Backend (FastAPI) + Postgres, containerized and ready to run.

## Quick start

```bash
# 1) Copy env for the frontend (optional)
cp frontend/.env.example frontend/.env

# 2) Build and run everything
docker compose up --build

# 3) Open the apps
# Frontend: http://localhost:8080
# Backend API docs: http://localhost:8000/docs
```

## Repo layout
- `frontend/` — your Vite export; builds to static assets served by Nginx
- `backend/` — FastAPI app with CRUD for ContentItem, Playlist (+items), Display, and DisplaySettings
- `docker-compose.yml` — full stack: frontend + backend + Postgres

## GitHub
```bash
git init
git add .
git commit -m "IsoDisplay: initial commit (frontend + backend + compose)"
git branch -M main
git remote add origin <YOUR_GITHUB_URL>
git push -u origin main
```
