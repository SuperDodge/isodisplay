from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db, Base, engine
from .. import crud, schemas

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/displays", tags=["displays"])

@router.get("/", response_model=list[schemas.Display])
def list_displays(is_active: bool | None = None, db: Session = Depends(get_db)):
    return crud.list_displays(db, is_active=is_active)

@router.get("/{id}", response_model=schemas.Display)
def get_display(id: str, db: Session = Depends(get_db)):
    d = crud.get_display(db, id)
    if not d: raise HTTPException(status_code=404, detail="Not found")
    return d

@router.post("/", response_model=schemas.Display, status_code=201)
def create_display(payload: schemas.DisplayCreate, db: Session = Depends(get_db)):
    return crud.create_display(db, payload)

@router.put("/{id}", response_model=schemas.Display)
def update_display(id: str, payload: schemas.DisplayUpdate, db: Session = Depends(get_db)):
    d = crud.update_display(db, id, payload)
    if not d: raise HTTPException(status_code=404, detail="Not found")
    return d

@router.delete("/{id}", status_code=204)
def delete_display(id: str, db: Session = Depends(get_db)):
    ok = crud.delete_display(db, id)
    if not ok: raise HTTPException(status_code=404, detail="Not found")
