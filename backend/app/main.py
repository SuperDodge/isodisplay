import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import content, playlists, displays, settings
from .db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IsoDisplay API", version="0.2.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(playlists.router)
app.include_router(displays.router)
app.include_router(settings.router)

@app.get("/health")
def health():
    return {"ok": True}
