from typing import Optional, List
from pydantic import BaseModel, Field

# ---- Content ----
class ContentItemBase(BaseModel):
    title: str
    type: str
    content: str
    duration: int = 10
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: bool = True
    pdf_page: Optional[int] = None
    background_color: str = "#ffffff"
    text_color: str = "#000000"
    font_size: str = "large"
    image_width: int = 100

class ContentItemCreate(ContentItemBase): pass

class ContentItemUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    pdf_page: Optional[int] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    font_size: Optional[str] = None
    image_width: Optional[int] = None

class ContentItem(ContentItemBase):
    id: str
    class Config: from_attributes = True

# ---- Playlist ----
class PlaylistItemRef(BaseModel):
    content_id: str
    duration: Optional[int] = None
    order: Optional[int] = None

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = False
    loop: bool = True
    transition_effect: str = "fade"
    content_items: Optional[List[PlaylistItemRef]] = Field(default=None)

class PlaylistCreate(PlaylistBase): pass

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    loop: Optional[bool] = None
    transition_effect: Optional[str] = None
    content_items: Optional[List[PlaylistItemRef]] = None

class PlaylistItem(BaseModel):
    id: str
    content_id: str
    duration: Optional[int] = None
    order: Optional[int] = None
    class Config: from_attributes = True

class Playlist(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    loop: bool
    transition_effect: str
    items: list[PlaylistItem] = []
    class Config: from_attributes = True

# ---- Display ----
class DisplayBase(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    active_playlist_id: Optional[str] = None
    background_color: str = "#000000"
    show_clock: bool = False
    clock_position: str = "top-right"

class DisplayCreate(DisplayBase): pass

class DisplayUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    active_playlist_id: Optional[str] = None
    background_color: Optional[str] = None
    show_clock: Optional[bool] = None
    clock_position: Optional[str] = None

class Display(DisplayBase):
    id: str
    class Config: from_attributes = True

# ---- Display Settings ----
class DisplaySettingsBase(BaseModel):
    background_color: str = "#000000"
    show_clock: bool = False
    clock_position: str = "top-right"

class DisplaySettingsUpdate(DisplaySettingsBase): pass

class DisplaySettings(DisplaySettingsBase):
    id: str
    class Config: from_attributes = True
