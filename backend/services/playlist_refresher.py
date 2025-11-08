import spotipy
from typing import List, Dict
from database import supabase
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PlaylistRefresher:
    """Service for automatically refreshing genre-based playlists"""
    
    def __init__(self, spotify_client: spotipy.Spotify, user_id: str):
        self.sp = spotify_client
        self.user_id = user_id
    
    def refresh_playlist(self, playlist_id: str, genre: str) -> Dict:
        """Refresh a genre playlist with latest matching songs from liked tracks"""
        try:
            # Get all liked songs
            all_liked_tracks = []
            offset = 0
            limit = 50
            
            while True:
                results = self.sp.current_user_saved_tracks(limit=limit, offset=offset)
                all_liked_tracks.extend(results['items'])
                
                if len(results['items']) < limit:
                    break
                offset += limit
            
            # Filter tracks by genre (simplified - in production use proper genre detection)
            matching_tracks = []
            for item in all_liked_tracks:
                track = item['track']
                # Get artist genres
                try:
                    artist_id = track['artists'][0]['id']
                    artist_info = self.sp.artist(artist_id)
                    artist_genres = artist_info.get('genres', [])
                    
                    # Check if track matches playlist genre
                    if any(genre.lower() in g.lower() for g in artist_genres):
                        matching_tracks.append(track['uri'])
                except Exception as e:
                    logger.error(f"Error checking track genre: {str(e)}")
                    continue
            
            if not matching_tracks:
                return {
                    'playlist_id': playlist_id,
                    'tracks_added': 0,
                    'message': 'No matching tracks found'
                }
            
            # Get current playlist tracks
            current_tracks = []
            results = self.sp.playlist_tracks(playlist_id)
            current_tracks = [item['track']['uri'] for item in results['items'] if item['track']]
            
            # Add only new tracks
            new_tracks = [uri for uri in matching_tracks if uri not in current_tracks]
            
            if new_tracks:
                # Add in batches of 100 (Spotify API limit)
                for i in range(0, len(new_tracks), 100):
                    batch = new_tracks[i:i+100]
                    self.sp.playlist_add_items(playlist_id, batch)
            
            # Update last refreshed time in database
            supabase.table('playlists').update({
                'updated_at': datetime.utcnow().isoformat()
            }).eq('spotify_playlist_id', playlist_id).execute()
            
            logger.info(f"Refreshed playlist {playlist_id}, added {len(new_tracks)} tracks")
            
            return {
                'playlist_id': playlist_id,
                'tracks_added': len(new_tracks),
                'total_tracks': len(matching_tracks)
            }
            
        except Exception as e:
            logger.error(f"Error refreshing playlist: {str(e)}")
            raise
    
    def refresh_all_auto_playlists(self) -> List[Dict]:
        """Refresh all auto-managed playlists for the user"""
        try:
            # Get all auto-managed playlists
            result = supabase.table('playlists').select('*').eq('user_id', self.user_id).eq('is_auto_managed', True).execute()
            
            results = []
            for playlist in result.data:
                try:
                    refresh_result = self.refresh_playlist(
                        playlist['spotify_playlist_id'],
                        playlist['genre']
                    )
                    results.append({
                        'playlist_name': playlist['name'],
                        **refresh_result
                    })
                except Exception as e:
                    logger.error(f"Error refreshing playlist {playlist['name']}: {str(e)}")
                    continue
            
            return results
            
        except Exception as e:
            logger.error(f"Error refreshing all playlists: {str(e)}")
            raise

