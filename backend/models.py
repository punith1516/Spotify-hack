from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class User(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    spotify_id: str
    access_token: str
    refresh_token: str
    token_expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Playlist(BaseModel):
    id: str
    user_id: str
    spotify_playlist_id: str
    name: str
    genre: Optional[str] = None
    is_auto_managed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SavedQueue(BaseModel):
    id: str
    user_id: str
    name: str
    tracks: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Track(BaseModel):
    id: str
    spotify_track_id: str
    name: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    audio_features: Optional[Dict[str, Any]] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"

class UserProfile(BaseModel):
    spotify_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None

