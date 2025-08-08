# IsoDisplay App – Project Context for Codex

## 1. Background
This project is a rebuild of an app originally developed in **Base44** and later exported with limited backend functionality.  
The goal was to fully migrate **off Base44**, reconstruct the missing backend, and containerize the whole stack so it can run locally or on any Docker-compatible server.

---

## 2. Migration Overview
### Original Sources
- **Base44 export ZIP**: contained mostly frontend assets and minimal backend logic.
- **CSV exports**:
  - `ContentItem_export.csv`
  - `Playlist_export.csv`
  - `Display_export.csv`
  - `DisplaySettings_export.csv`
- **Screenshots** of Base44 UI views for ContentItem, Playlist, Display, and DisplaySettings.

### Key Decisions
- Create a **minimal backend** in Node.js + Express + PostgreSQL to serve API endpoints and manage data.
- Use **React + Vite + Tailwind** for the frontend (based on the exported components).
- Add **Docker Compose** for a unified multi-container setup:
  - `frontend` service
  - `backend` service
  - `db` (PostgreSQL) service

---

## 3. Repository Setup
### GitHub Repo
- Name: `isodisplay`
- Owner: `SuperDodge` (GitHub username)
- SSH remote: `git@github.com:SuperDodge/isodisplay.git`

### Steps Taken
1. Unpacked Base44 export and restructured into `frontend/` and `backend/`.
2. Created `docker-compose.yml` with services for frontend, backend, and PostgreSQL.
3. Added `.dockerignore` and `.gitignore` for clean builds.
4. Configured Postgres with `init.sql` ready to import CSV data.
5. Resolved GitHub **GH007 email privacy restriction** by:
   - Setting `git config user.email "10373968+SuperDodge@users.noreply.github.com"`
   - Amending commits to replace personal email
   - Force-pushing with `git push -u origin main --force`

---

## 4. Local Development
To run locally:
```bash
git clone git@github.com:SuperDodge/isodisplay.git
cd isodisplay
cp frontend/.env.example frontend/.env
docker compose up --build
