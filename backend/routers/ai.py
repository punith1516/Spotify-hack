from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from config import get_settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()

class GeneratePlaylistNameRequest(BaseModel):
    tracks: List[str]  # Track names
    mood: Optional[str] = None
    genre: Optional[str] = None

@router.post("/generate-playlist-name")
async def generate_playlist_name(request: GeneratePlaylistNameRequest):
    """Generate creative playlist name using OpenAI (Optional Feature)"""
    if not settings.openai_api_key:
        return {
            'name': f"{request.genre or 'Mixed'} Vibes",
            'message': 'OpenAI API key not configured, using default name'
        }
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        
        # Create prompt
        track_list = ', '.join(request.tracks[:10])  # Limit to first 10 tracks
        mood_text = f" with a {request.mood} mood" if request.mood else ""
        genre_text = f" in the {request.genre} genre" if request.genre else ""
        
        prompt = f"""Generate a creative, catchy playlist name for a playlist{genre_text}{mood_text}.
        
Sample tracks include: {track_list}

Provide only the playlist name, nothing else. Keep it under 6 words."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative music curator who creates catchy playlist names."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.8
        )
        
        name = response.choices[0].message.content.strip()
        
        return {'name': name}
    except Exception as e:
        logger.error(f"Error generating playlist name: {str(e)}")
        # Fallback to simple name
        return {
            'name': f"{request.genre or 'Mixed'} Collection",
            'message': 'Using fallback name'
        }

@router.post("/suggest-genre")
async def suggest_genre(track_features: dict):
    """Suggest genre based on track audio features"""
    try:
        # Simple rule-based genre detection based on audio features
        # In production, you could use ML model or OpenAI
        
        energy = track_features.get('energy', 0.5)
        danceability = track_features.get('danceability', 0.5)
        valence = track_features.get('valence', 0.5)
        acousticness = track_features.get('acousticness', 0.5)
        tempo = track_features.get('tempo', 120)
        
        # Simple classification logic
        if acousticness > 0.7:
            genre = "Acoustic"
        elif energy > 0.8 and tempo > 140:
            genre = "Electronic/Dance"
        elif energy > 0.7 and danceability > 0.7:
            genre = "Pop"
        elif valence < 0.4 and energy < 0.5:
            genre = "Sad/Chill"
        elif energy < 0.5 and acousticness > 0.4:
            genre = "Folk/Indie"
        elif energy > 0.6 and valence > 0.6:
            genre = "Happy/Upbeat"
        else:
            genre = "Mixed"
        
        return {
            'suggested_genre': genre,
            'confidence': 0.7  # Placeholder confidence score
        }
    except Exception as e:
        logger.error(f"Error suggesting genre: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

