import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Spotify Configuration
    spotify_client_id: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    spotify_client_secret: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    spotify_redirect_uri: str = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")
    
    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    
    # OpenAI Configuration (Optional)
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Application Settings
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Spotify OAuth Scopes
    spotify_scopes: str = "user-read-email user-read-private user-library-read user-read-recently-played playlist-read-private playlist-modify-public playlist-modify-private user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-playback-position"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

