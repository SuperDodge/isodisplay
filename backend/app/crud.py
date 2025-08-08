from sqlalchemy.orm import Session
from . import models, schemas

def list_to_csv(lst):
    if lst is None: return None
    return ",".join(lst)
def csv_to_list(s):
    if not s: return []
    return [t.strip() for t in s.split(",")]

# ---- Content ----
def get_content_items(db: Session, is_active: bool | None = None, type: str | None = None, tag: str | None = None):
    q = db.query(models.ContentItem)
    if is_active is not None:
        q = q.filter(models.ContentItem.is_active == is_active)
    if type is not None:
        q = q.filter(models.ContentItem.type == type)
    items = q.all()
    if tag:
        items = [i for i in items if tag in csv_to_list(i.tags)]
    return items

def get_content_item(db: Session, id: str):
    return db.get(models.ContentItem, id)

def create_content_item(db: Session, data: schemas.ContentItemCreate):
    m = models.ContentItem(**data.model_dump(exclude={'tags'}))
    m.tags = list_to_csv(data.tags)
    db.add(m); db.commit(); db.refresh(m); return m

def update_content_item(db: Session, id: str, data: schemas.ContentItemUpdate):
    m = get_content_item(db, id)
    if not m: return None
    for k, v in data.model_dump(exclude_unset=True, exclude={'tags'}).items():
        setattr(m, k, v)
    if data.tags is not None:
        m.tags = list_to_csv(data.tags)
    db.commit(); db.refresh(m); return m

def delete_content_item(db: Session, id: str):
    m = get_content_item(db, id)
    if not m: return False
    db.delete(m); db.commit(); return True

# ---- Playlists ----
def list_playlists(db: Session, is_active: bool | None = None):
    q = db.query(models.Playlist)
    if is_active is not None:
        q = q.filter(models.Playlist.is_active == is_active)
    return q.all()

def get_playlist(db: Session, id: str):
    return db.get(models.Playlist, id)

def create_playlist(db: Session, data: schemas.PlaylistCreate):
    pl = models.Playlist(
        name=data.name, description=data.description,
        is_active=data.is_active, loop=data.loop,
        transition_effect=data.transition_effect
    )
    db.add(pl); db.flush()
    if data.content_items:
        for idx, ref in enumerate(data.content_items):
            db.add(models.PlaylistItem(
                playlist_id=pl.id, content_id=ref.content_id,
                duration=ref.duration, order=ref.order if ref.order is not None else idx
            ))
    db.commit(); db.refresh(pl); return pl

def update_playlist(db: Session, id: str, data: schemas.PlaylistUpdate):
    pl = get_playlist(db, id)
    if not pl: return None
    for k, v in data.model_dump(exclude_unset=True, exclude={'content_items'}).items():
        setattr(pl, k, v)
    if data.content_items is not None:
        db.query(models.PlaylistItem).filter(models.PlaylistItem.playlist_id==pl.id).delete()
        for idx, ref in enumerate(data.content_items or []):
            db.add(models.PlaylistItem(
                playlist_id=pl.id, content_id=ref.content_id,
                duration=ref.duration, order=ref.order if ref.order is not None else idx
            ))
    db.commit(); db.refresh(pl); return pl

def delete_playlist(db: Session, id: str):
    pl = get_playlist(db, id)
    if not pl: return False
    db.delete(pl); db.commit(); return True

# ---- Displays ----
def list_displays(db: Session, is_active: bool | None = None):
    q = db.query(models.Display)
    if is_active is not None:
        q = q.filter(models.Display.is_active == is_active)
    return q.all()

def get_display(db: Session, id: str):
    return db.get(models.Display, id)

def create_display(db: Session, data: schemas.DisplayCreate):
    d = models.Display(**data.model_dump())
    db.add(d); db.commit(); db.refresh(d); return d

def update_display(db: Session, id: str, data: schemas.DisplayUpdate):
    d = get_display(db, id)
    if not d: return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit(); db.refresh(d); return d

def delete_display(db: Session, id: str):
    d = get_display(db, id)
    if not d: return False
    db.delete(d); db.commit(); return True

# ---- DisplaySettings (singleton row optional) ----
def get_display_settings(db: Session):
    return db.query(models.DisplaySettings).first()

def upsert_display_settings(db: Session, data: schemas.DisplaySettingsUpdate):
    s = get_display_settings(db)
    if not s:
        s = models.DisplaySettings(**data.model_dump())
        db.add(s)
    else:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(s, k, v)
    db.commit(); db.refresh(s); return s
