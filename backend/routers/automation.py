from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
import spotipy
from config import get_settings
from database import supabase
from services.auto_genre_sorter import AutoGenreSorter
from services.playlist_refresher import PlaylistRefresher
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/automation", tags=["automation"])
settings = get_settings()

def get_spotify_client(request: Request):
    """Get authenticated Spotify client from request"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization token")
    
    access_token = auth_header.split("Bearer ")[1]
    return spotipy.Spotify(auth=access_token)

@router.post("/auto-sort-songs")
async def auto_sort_liked_songs(
    spotify_id: str,
    limit: int = 50,
    request: Request = None,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Automatically sort liked songs into genre-based playlists"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Initialize auto genre sorter
        sorter = AutoGenreSorter(sp, user_id, spotify_id)
        
        # Process liked songs
        results = sorter.process_liked_songs(limit=limit)
        
        return {
            'message': f'Successfully processed {len(results)} songs',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error auto-sorting songs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-playlists")
async def refresh_all_playlists(
    spotify_id: str,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Refresh all auto-managed playlists"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Initialize playlist refresher
        refresher = PlaylistRefresher(sp, user_id)
        
        # Refresh all playlists
        results = refresher.refresh_all_auto_playlists()
        
        return {
            'message': f'Successfully refreshed {len(results)} playlists',
            'results': results
        }
    except Exception as e:
        logger.error(f"Error refreshing playlists: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-playlist/{playlist_id}")
async def refresh_single_playlist(
    playlist_id: str,
    genre: str,
    spotify_id: str,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Refresh a single playlist"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Initialize playlist refresher
        refresher = PlaylistRefresher(sp, user_id)
        
        # Refresh the playlist
        result = refresher.refresh_playlist(playlist_id, genre)
        
        return {
            'message': 'Playlist refreshed successfully',
            'result': result
        }
    except Exception as e:
        logger.error(f"Error refreshing playlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/genre-playlists/{spotify_id}")
async def get_genre_playlists(spotify_id: str):
    """Get all auto-managed genre playlists for a user"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Get all genre playlists
        playlists_result = supabase.table('playlists').select('*').eq('user_id', user_id).eq('is_auto_managed', True).execute()
        
        return {
            'playlists': playlists_result.data
        }
    except Exception as e:
        logger.error(f"Error getting genre playlists: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

