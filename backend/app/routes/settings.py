from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db, Base, engine
from .. import crud, schemas

Base.metadata.create_all(bind=engine)
router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/display", response_model=schemas.DisplaySettings)
def get_display_settings(db: Session = Depends(get_db)):
    s = crud.get_display_settings(db)
    if not s:
        s = crud.upsert_display_settings(db, schemas.DisplaySettingsUpdate())
    return s

@router.put("/display", response_model=schemas.DisplaySettings)
def update_display_settings(payload: schemas.DisplaySettingsUpdate, db: Session = Depends(get_db)):
    return crud.upsert_display_settings(db, payload)
