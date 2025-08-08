import uuid
from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

def UUIDCol():
    # For portability across Postgres/SQLite, store UUIDs as strings in MVP
    return Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

class ContentItem(Base):
    __tablename__ = "content_items"
    id = UUIDCol()
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)   # image, video, webpage, youtube, text, pdf
    content = Column(Text, nullable=False)  # URL or inline text
    duration = Column(Integer, default=10)
    thumbnail = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)      # comma-separated; API exposes list[str]
    is_active = Column(Boolean, default=True)
    pdf_page = Column(Integer, nullable=True)
    background_color = Column(String, default="#ffffff")
    text_color = Column(String, default="#000000")
    font_size = Column(String, default="large") # small, medium, large, xlarge
    image_width = Column(Integer, default=100)

    playlist_items = relationship("PlaylistItem", back_populates="content", cascade="all, delete-orphan")

class Playlist(Base):
    __tablename__ = "playlists"
    id = UUIDCol()
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    loop = Column(Boolean, default=True)
    transition_effect = Column(String, default="fade")

    items = relationship("PlaylistItem", back_populates="playlist", order_by="PlaylistItem.order", cascade="all, delete-orphan")

class PlaylistItem(Base):
    __tablename__ = "playlist_items"
    id = UUIDCol()
    playlist_id = Column(String, ForeignKey("playlists.id"), nullable=False)
    content_id = Column(String, ForeignKey("content_items.id"), nullable=False)
    duration = Column(Integer, nullable=True)
    order = Column(Integer, nullable=True)

    playlist = relationship("Playlist", back_populates="items")
    content = relationship("ContentItem", back_populates="playlist_items")

class Display(Base):
    __tablename__ = "displays"
    id = UUIDCol()
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    active_playlist_id = Column(String, ForeignKey("playlists.id"), nullable=True)
    background_color = Column(String, default="#000000")
    show_clock = Column(Boolean, default=False)
    clock_position = Column(String, default="top-right")

    active_playlist = relationship("Playlist", lazy="joined", foreign_keys=[active_playlist_id])

class DisplaySettings(Base):
    __tablename__ = "display_settings"
    id = UUIDCol()
    # global or per-organization settings can be stored here; starting simple
    background_color = Column(String, default="#000000")
    show_clock = Column(Boolean, default=False)
    clock_position = Column(String, default="top-right")
