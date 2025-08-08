from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db, Base, engine
from .. import crud, schemas

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/content", tags=["content"])

@router.get("/", response_model=list[schemas.ContentItem])
def list_content(is_active: bool | None = None, type: str | None = None, tag: str | None = None, db: Session = Depends(get_db)):
    return crud.get_content_items(db, is_active=is_active, type=type, tag=tag)

@router.get("/{id}", response_model=schemas.ContentItem)
def get_content(id: str, db: Session = Depends(get_db)):
    m = crud.get_content_item(db, id)
    if not m: raise HTTPException(status_code=404, detail="Not found")
    return m

@router.post("/", response_model=schemas.ContentItem, status_code=201)
def create_content(payload: schemas.ContentItemCreate, db: Session = Depends(get_db)):
    return crud.create_content_item(db, payload)

@router.put("/{id}", response_model=schemas.ContentItem)
def update_content(id: str, payload: schemas.ContentItemUpdate, db: Session = Depends(get_db)):
    m = crud.update_content_item(db, id, payload)
    if not m: raise HTTPException(status_code=404, detail="Not found")
    return m

@router.delete("/{id}", status_code=204)
def delete_content(id: str, db: Session = Depends(get_db)):
    ok = crud.delete_content_item(db, id)
    if not ok: raise HTTPException(status_code=404, detail="Not found")
