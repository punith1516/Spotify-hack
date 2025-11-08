import spotipy
from typing import Dict, List
from database import supabase
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AutoGenreSorter:
    """Service for automatically sorting songs into genre-based playlists"""
    
    def __init__(self, spotify_client: spotipy.Spotify, user_id: str, spotify_id: str):
        self.sp = spotify_client
        self.user_id = user_id
        self.spotify_id = spotify_id
    
    def get_track_genre(self, track_id: str) -> str:
        """Determine genre for a track based on audio features and artist genres"""
        try:
            # Get track info
            track_info = self.sp.track(track_id)
            track_name = track_info['name']
            logger.info(f"🎵 Analyzing track: {track_name}")
            
            # Get artist and album info
            artist_id = track_info['artists'][0]['id']
            artist_name = track_info['artists'][0]['name']
            artist_info = self.sp.artist(artist_id)
            artist_genres = artist_info.get('genres', [])
            
            # Also get album genres as fallback
            album_genres = track_info.get('album', {}).get('genres', [])
            
            # Combine artist and album genres
            all_genres = list(set(artist_genres + album_genres))
            
            logger.info(f"🎤 Artist: {artist_name}, Genres: {artist_genres}")
            if album_genres:
                logger.info(f"💿 Album Genres: {album_genres}")
            if all_genres:
                logger.info(f"🎵 Combined Genres: {all_genres}")
            
            # If artist or album has clear genre, use it
            if all_genres:
                # Map Spotify genres to simplified categories
                genre_map = {
                    'pop': ['pop', 'dance pop', 'electropop', 'k-pop', 'j-pop', 'teen pop', 'art pop', 'chamber pop'],
                    'rock': ['rock', 'indie rock', 'alternative rock', 'classic rock', 'hard rock', 'punk', 'grunge', 'metal'],
                    'hip-hop': ['hip hop', 'rap', 'trap', 'drill', 'grime', 'boom bap'],
                    'electronic': ['edm', 'house', 'techno', 'dubstep', 'electronic', 'trance', 'ambient', 'chillwave'],
                    'r&b': ['r&b', 'soul', 'neo soul', 'motown', 'funk', 'northern soul', 'classic soul'],
                    'country': ['country', 'contemporary country', 'bluegrass', 'americana'],
                    'jazz': ['jazz', 'smooth jazz', 'vocal jazz', 'jazz fusion', 'bebop', 'big band', 'swing'],
                    'classical': ['classical', 'orchestra', 'symphony', 'baroque', 'opera'],
                    'latin': ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'merengue'],
                    'indie': ['indie', 'indie pop', 'indie rock', 'indie folk', 'bedroom pop']
                }
                
                for simplified_genre, keywords in genre_map.items():
                    for genre in all_genres:
                        if any(keyword in genre.lower() for keyword in keywords):
                            logger.info(f"✅ Matched genre: {simplified_genre.title()} (from: {genre})")
                            return simplified_genre.title()
            
            # Fallback to audio features-based classification
            logger.info(f"⚠️ No genre match from artist, trying audio features...")
            
            try:
                features = self.sp.audio_features([track_id])[0]
                
                if not features:
                    logger.warning(f"❌ No audio features available for {track_name}")
                    return "Uncategorized"
                
                energy = features.get('energy', 0.5)
                danceability = features.get('danceability', 0.5)
                acousticness = features.get('acousticness', 0.5)
                valence = features.get('valence', 0.5)
                
                logger.info(f"📊 Audio features - Energy: {energy}, Dance: {danceability}, Acoustic: {acousticness}")
                
                if acousticness > 0.7:
                    result = "Acoustic"
                elif energy > 0.8 and danceability > 0.7:
                    result = "Electronic"
                elif energy > 0.7:
                    result = "Energetic"
                elif valence < 0.4:
                    result = "Chill"
                else:
                    result = "Mixed"
                
                logger.info(f"✅ Classified as: {result}")
                return result
                
            except Exception as audio_error:
                # Audio features API might be restricted or unavailable
                logger.warning(f"⚠️ Audio features unavailable (likely 403): {audio_error}")
                logger.info(f"📝 Classifying {track_name} as Mixed (fallback)")
                return "Mixed"
                
        except Exception as e:
            logger.error(f"❌ Error determining genre for track {track_id}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "Uncategorized"
    
    def get_or_create_genre_playlist(self, genre: str) -> str:
        """Get existing genre playlist or create new one"""
        try:
            # Check if playlist exists in database
            result = supabase.table('playlists').select('spotify_playlist_id').eq('user_id', self.user_id).eq('genre', genre).eq('is_auto_managed', True).execute()
            
            if result.data:
                return result.data[0]['spotify_playlist_id']
            
            # Create new playlist
            playlist_name = f"🎵 {genre} Collection"
            playlist = self.sp.user_playlist_create(
                self.spotify_id,
                playlist_name,
                public=False,
                description=f"Auto-generated playlist for {genre} tracks"
            )
            
            # Save to database
            playlist_data = {
                'user_id': self.user_id,
                'spotify_playlist_id': playlist['id'],
                'name': playlist_name,
                'genre': genre,
                'is_auto_managed': True,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            supabase.table('playlists').insert(playlist_data).execute()
            
            logger.info(f"Created new genre playlist: {playlist_name}")
            return playlist['id']
            
        except Exception as e:
            logger.error(f"Error getting/creating genre playlist: {str(e)}")
            raise
    
    def add_track_to_genre_playlist(self, track_id: str, track_uri: str) -> Dict:
        """Add a track to its appropriate genre playlist"""
        try:
            # Determine genre
            genre = self.get_track_genre(track_id)
            
            # Get or create playlist
            playlist_id = self.get_or_create_genre_playlist(genre)
            
            # Add track to playlist
            self.sp.playlist_add_items(playlist_id, [track_uri])
            
            logger.info(f"Added track {track_id} to {genre} playlist")
            
            return {
                'track_id': track_id,
                'genre': genre,
                'playlist_id': playlist_id
            }
            
        except Exception as e:
            logger.error(f"Error adding track to genre playlist: {str(e)}")
            raise
    
    def process_liked_songs(self, limit: int = 50) -> List[Dict]:
        """Process recently liked songs and sort them into genre playlists"""
        try:
            results = self.sp.current_user_saved_tracks(limit=limit)
            processed = []
            
            for item in results['items']:
                track = item['track']
                try:
                    result = self.add_track_to_genre_playlist(track['id'], track['uri'])
                    processed.append(result)
                except Exception as e:
                    logger.error(f"Error processing track {track['id']}: {str(e)}")
                    continue
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing liked songs: {str(e)}")
            raise

