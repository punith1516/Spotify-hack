from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from typing import List, Dict, Any
from datetime import datetime
from database import supabase
from pydantic import BaseModel
import spotipy
import logging
from services.smart_playlist_matcher import SmartPlaylistMatcher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/queues", tags=["queues"])

class SaveQueueRequest(BaseModel):
    name: str
    tracks: List[Dict[str, Any]]
    spotify_id: str

class ReplayQueueRequest(BaseModel):
    queue_id: str
    spotify_id: str

def get_user_from_token(request: Request) -> str:
    """Extract user ID from authorization token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization token")
    return auth_header.split("Bearer ")[1]

def get_spotify_client(request: Request):
    """Get authenticated Spotify client from request"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization token")
    
    access_token = auth_header.split("Bearer ")[1]
    return spotipy.Spotify(auth=access_token)

@router.post("/save")
async def save_queue(request: SaveQueueRequest):
    """Save current queue with a custom name"""
    try:
        # Check if user exists
        user_result = supabase.table('users').select('*').eq('spotify_id', request.spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Save queue to database
        queue_data = {
            'user_id': user_id,
            'name': request.name,
            'tracks': request.tracks,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('saved_queues').insert(queue_data).execute()
        
        return {
            'message': 'Queue saved successfully',
            'queue': result.data[0]
        }
    except Exception as e:
        logger.error(f"Error saving queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{spotify_id}")
async def list_saved_queues(spotify_id: str):
    """List all saved queues for a user"""
    try:
        # Get user
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Get all saved queues
        queues_result = supabase.table('saved_queues').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return {
            'queues': queues_result.data
        }
    except Exception as e:
        logger.error(f"Error listing queues: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{queue_id}")
async def get_queue(queue_id: str):
    """Get a specific saved queue with all track details"""
    try:
        result = supabase.table('saved_queues').select('*').eq('id', queue_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Queue not found")
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Error getting queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{queue_id}")
async def delete_queue(queue_id: str, spotify_id: str):
    """Delete a saved queue"""
    try:
        # Verify ownership
        queue = supabase.table('saved_queues').select('user_id').eq('id', queue_id).execute()
        if not queue.data:
            raise HTTPException(status_code=404, detail="Queue not found")
        
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data or user_result.data[0]['id'] != queue.data[0]['user_id']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this queue")
        
        # Delete queue
        supabase.table('saved_queues').delete().eq('id', queue_id).execute()
        
        return {'message': 'Queue deleted successfully'}
    except Exception as e:
        logger.error(f"Error deleting queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{queue_id}")
async def update_queue(queue_id: str, name: str, spotify_id: str):
    """Update queue name"""
    try:
        # Verify ownership
        queue = supabase.table('saved_queues').select('user_id').eq('id', queue_id).execute()
        if not queue.data:
            raise HTTPException(status_code=404, detail="Queue not found")
        
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data or user_result.data[0]['id'] != queue.data[0]['user_id']:
            raise HTTPException(status_code=403, detail="Not authorized to update this queue")
        
        # Update queue
        update_data = {
            'name': name,
            'updated_at': datetime.utcnow().isoformat()
        }
        result = supabase.table('saved_queues').update(update_data).eq('id', queue_id).execute()
        
        return {
            'message': 'Queue updated successfully',
            'queue': result.data[0]
        }
    except Exception as e:
        logger.error(f"Error updating queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# NEW ENDPOINTS FOR SMART AUTO-SORT

@router.post("/smart-sort-track")
async def smart_sort_track(
    track_id: str,
    spotify_id: str,
    request: Request = None,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """
    Analyze a newly liked track and automatically add it to the best matching playlist.
    Creates a new playlist if similarity is too low.
    """
    try:
        # Get user's playlists
        user_playlists_response = sp.current_user_playlists(limit=50)
        user_playlists = user_playlists_response['items']
        
        # Filter to only user-owned playlists
        current_user = sp.current_user()
        user_id = current_user['id']
        owned_playlists = [p for p in user_playlists if p['owner']['id'] == user_id]
        
        # Get track info
        track_info = sp.track(track_id)
        track_name = track_info['name']
        artists = ', '.join([a['name'] for a in track_info['artists']])
        
        # Initialize matcher
        matcher = SmartPlaylistMatcher(sp)
        
        # Find best matching playlist
        match = matcher.find_best_playlist_match(track_id, owned_playlists, min_similarity=0.6)
        
        if match:
            # Add to existing playlist
            playlist_id = match['playlist_id']
            sp.playlist_add_items(playlist_id, [f"spotify:track:{track_id}"])
            
            return {
                'action': 'added_to_existing',
                'track_name': track_name,
                'artists': artists,
                'playlist_name': match['playlist_name'],
                'similarity': round(match['similarity'], 2),
                'message': f"Added '{track_name}' to '{match['playlist_name']}' (similarity: {round(match['similarity'] * 100)}%)"
            }
        else:
            # No good match - create new playlist based on track features
            features = matcher.get_track_features(track_id)
            
            # Determine playlist name based on features
            if features['energy'] > 0.7 and features['danceability'] > 0.7:
                new_playlist_name = "High Energy Mix"
            elif features['acousticness'] > 0.6:
                new_playlist_name = "Acoustic Vibes"
            elif features['valence'] < 0.4:
                new_playlist_name = "Chill & Moody"
            elif features['energy'] > 0.6:
                new_playlist_name = "Upbeat Collection"
            else:
                new_playlist_name = "New Discoveries"
            
            # Check if this auto-created playlist already exists
            existing = [p for p in owned_playlists if p['name'] == new_playlist_name]
            
            if existing:
                # Use existing auto-playlist
                playlist_id = existing[0]['id']
            else:
                # Create new playlist
                new_playlist = sp.user_playlist_create(
                    user_id,
                    new_playlist_name,
                    public=False,
                    description=f"Auto-created playlist for similar tracks"
                )
                playlist_id = new_playlist['id']
            
            # Add track
            sp.playlist_add_items(playlist_id, [f"spotify:track:{track_id}"])
            
            return {
                'action': 'created_new_playlist',
                'track_name': track_name,
                'artists': artists,
                'playlist_name': new_playlist_name,
                'message': f"Created '{new_playlist_name}' and added '{track_name}'"
            }
    
    except Exception as e:
        logger.error(f"Error in smart sort: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enable-auto-sort")
async def enable_auto_sort(spotify_id: str):
    """Enable automatic sorting for newly liked songs"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Update user settings
        supabase.table('users').update({
            'auto_sort_enabled': True,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user_id).execute()
        
        return {'message': 'Auto-sort enabled', 'enabled': True}
    except Exception as e:
        logger.error(f"Error enabling auto-sort: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disable-auto-sort")
async def disable_auto_sort(spotify_id: str):
    """Disable automatic sorting for newly liked songs"""
    try:
        # Get user from database
        user_result = supabase.table('users').select('id').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]['id']
        
        # Update user settings
        supabase.table('users').update({
            'auto_sort_enabled': False,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user_id).execute()
        
        return {'message': 'Auto-sort disabled', 'enabled': False}
    except Exception as e:
        logger.error(f"Error disabling auto-sort: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auto-sort-status/{spotify_id}")
async def get_auto_sort_status(spotify_id: str):
    """Get auto-sort status for user"""
    try:
        user_result = supabase.table('users').select('auto_sort_enabled').eq('spotify_id', spotify_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            'enabled': user_result.data[0].get('auto_sort_enabled', False)
        }
    except Exception as e:
        logger.error(f"Error getting auto-sort status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
