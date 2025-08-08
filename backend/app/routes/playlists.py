from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db, Base, engine
from .. import crud, schemas

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/playlists", tags=["playlists"])

@router.get("/", response_model=list[schemas.Playlist])
def list_playlists(is_active: bool | None = None, db: Session = Depends(get_db)):
    return crud.list_playlists(db, is_active=is_active)

@router.get("/{id}", response_model=schemas.Playlist)
def get_playlist(id: str, db: Session = Depends(get_db)):
    pl = crud.get_playlist(db, id)
    if not pl: raise HTTPException(status_code=404, detail="Not found")
    return pl

@router.post("/", response_model=schemas.Playlist, status_code=201)
def create_playlist(payload: schemas.PlaylistCreate, db: Session = Depends(get_db)):
    return crud.create_playlist(db, payload)

@router.put("/{id}", response_model=schemas.Playlist)
def update_playlist(id: str, payload: schemas.PlaylistUpdate, db: Session = Depends(get_db)):
    pl = crud.update_playlist(db, id, payload)
    if not pl: raise HTTPException(status_code=404, detail="Not found")
    return pl

@router.delete("/{id}", status_code=204)
def delete_playlist(id: str, db: Session = Depends(get_db)):
    ok = crud.delete_playlist(db, id)
    if not ok: raise HTTPException(status_code=404, detail="Not found")
