from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from config import get_settings
from database import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/spotify", tags=["spotify"])
settings = get_settings()

def get_spotify_client(request: Request):
    """Get authenticated Spotify client from request"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization token")
    
    access_token = auth_header.split("Bearer ")[1]
    return spotipy.Spotify(auth=access_token)

@router.get("/liked-songs")
async def get_liked_songs(
    limit: int = 50,
    offset: int = 0,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Fetch user's liked songs"""
    try:
        results = sp.current_user_saved_tracks(limit=limit, offset=offset)
        
        tracks = []
        for item in results['items']:
            track = item['track']
            tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artists': [artist['name'] for artist in track['artists']],
                'album': track['album']['name'],
                'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'duration_ms': track['duration_ms'],
                'uri': track['uri'],
                'added_at': item['added_at']
            })
        
        return {
            'tracks': tracks,
            'total': results['total'],
            'limit': limit,
            'offset': offset
        }
    except Exception as e:
        logger.error(f"Error fetching liked songs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recently-played")
async def get_recently_played(
    limit: int = 50,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Fetch user's recently played tracks"""
    try:
        results = sp.current_user_recently_played(limit=limit)
        
        tracks = []
        for item in results['items']:
            track = item['track']
            tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artists': [artist['name'] for artist in track['artists']],
                'album': track['album']['name'],
                'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'played_at': item['played_at'],
                'uri': track['uri']
            })
        
        return {'tracks': tracks}
    except Exception as e:
        logger.error(f"Error fetching recently played: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlists")
async def get_user_playlists(
    limit: int = 50,
    offset: int = 0,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Fetch user's playlists"""
    try:
        results = sp.current_user_playlists(limit=limit, offset=offset)
        
        playlists = []
        for item in results['items']:
            playlists.append({
                'id': item['id'],
                'name': item['name'],
                'description': item.get('description', ''),
                'tracks_total': item['tracks']['total'],
                'images': item['images'],
                'uri': item['uri'],
                'owner': item['owner']['display_name']
            })
        
        return {
            'playlists': playlists,
            'total': results['total'],
            'limit': limit,
            'offset': offset
        }
    except Exception as e:
        logger.error(f"Error fetching playlists: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlist/{playlist_id}")
async def get_playlist_tracks(
    playlist_id: str,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Get tracks from a specific playlist"""
    try:
        playlist = sp.playlist(playlist_id)
        results = sp.playlist_tracks(playlist_id)
        
        tracks = []
        for item in results['items']:
            if item['track']:
                track = item['track']
                tracks.append({
                    'id': track['id'],
                    'name': track['name'],
                    'artists': [artist['name'] for artist in track['artists']],
                    'album': track['album']['name'],
                    'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'duration_ms': track['duration_ms'],
                    'uri': track['uri'],
                    'added_at': item['added_at']
                })
        
        return {
            'playlist': {
                'id': playlist['id'],
                'name': playlist['name'],
                'description': playlist.get('description', ''),
                'images': playlist['images']
            },
            'tracks': tracks
        }
    except Exception as e:
        logger.error(f"Error fetching playlist tracks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/queue")
async def get_current_queue(sp: spotipy.Spotify = Depends(get_spotify_client)):
    """Get current playback queue"""
    try:
        queue = sp.queue()
        
        currently_playing = None
        if queue.get('currently_playing'):
            track = queue['currently_playing']
            currently_playing = {
                'id': track['id'],
                'name': track['name'],
                'artists': [artist['name'] for artist in track['artists']],
                'album': track['album']['name'],
                'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'uri': track['uri']
            }
        
        queue_tracks = []
        for track in queue.get('queue', []):
            queue_tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artists': [artist['name'] for artist in track['artists']],
                'album': track['album']['name'],
                'album_art': track['album']['images'][0]['url'] if track['album']['images'] else None,
                'uri': track['uri']
            })
        
        return {
            'currently_playing': currently_playing,
            'queue': queue_tracks
        }
    except Exception as e:
        logger.error(f"Error fetching queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/playlist/create")
async def create_playlist(
    name: str,
    description: str = "",
    public: bool = False,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Create a new playlist"""
    try:
        user = sp.current_user()
        playlist = sp.user_playlist_create(
            user['id'],
            name,
            public=public,
            description=description
        )
        
        return {
            'id': playlist['id'],
            'name': playlist['name'],
            'uri': playlist['uri']
        }
    except Exception as e:
        logger.error(f"Error creating playlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/playlist/{playlist_id}/tracks")
async def add_tracks_to_playlist(
    playlist_id: str,
    track_uris: List[str],
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Add tracks to a playlist"""
    try:
        sp.playlist_add_items(playlist_id, track_uris)
        return {"message": f"Added {len(track_uris)} tracks to playlist"}
    except Exception as e:
        logger.error(f"Error adding tracks to playlist: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/track/{track_id}/features")
async def get_track_audio_features(
    track_id: str,
    sp: spotipy.Spotify = Depends(get_spotify_client)
):
    """Get audio features for a track (for genre detection)"""
    try:
        features = sp.audio_features([track_id])[0]
        track_info = sp.track(track_id)
        
        # Get artist genres
        artist_id = track_info['artists'][0]['id']
        artist_info = sp.artist(artist_id)
        
        return {
            'track_id': track_id,
            'audio_features': features,
            'artist_genres': artist_info['genres']
        }
    except Exception as e:
        logger.error(f"Error fetching track features: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

