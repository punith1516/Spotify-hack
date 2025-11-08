"""
Smart Playlist Matcher - Analyzes playlists and matches new songs to similar ones
"""
import spotipy
from typing import List, Dict, Any, Optional
import logging
from statistics import mean

logger = logging.getLogger(__name__)


class SmartPlaylistMatcher:
    """Analyzes playlist audio features and finds best match for new songs"""
    
    def __init__(self, sp: spotipy.Spotify):
        self.sp = sp
        
    def get_playlist_profile(self, playlist_id: str) -> Optional[Dict[str, float]]:
        """
        Analyze a playlist and create an audio feature profile
        Returns average audio features for the playlist
        """
        try:
            # Get all tracks from playlist
            results = self.sp.playlist_tracks(playlist_id)
            tracks = results['items']
            
            # Get more tracks if needed (pagination)
            while results['next']:
                results = self.sp.next(results)
                tracks.extend(results['items'])
            
            if not tracks:
                return None
            
            # Extract track IDs (filter out None and local tracks)
            track_ids = []
            for item in tracks:
                if item and item.get('track') and item['track'].get('id'):
                    track_ids.append(item['track']['id'])
            
            if not track_ids:
                return None
            
            # Get audio features for all tracks (Spotify API handles up to 100 at a time)
            all_features = []
            for i in range(0, len(track_ids), 100):
                batch = track_ids[i:i+100]
                features = self.sp.audio_features(batch)
                all_features.extend([f for f in features if f])
            
            if not all_features:
                return None
            
            # Calculate average features
            profile = {
                'danceability': mean([f['danceability'] for f in all_features]),
                'energy': mean([f['energy'] for f in all_features]),
                'valence': mean([f['valence'] for f in all_features]),
                'acousticness': mean([f['acousticness'] for f in all_features]),
                'instrumentalness': mean([f['instrumentalness'] for f in all_features]),
                'tempo': mean([f['tempo'] for f in all_features]),
                'loudness': mean([f['loudness'] for f in all_features]),
            }
            
            logger.info(f"Created profile for playlist {playlist_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Error creating playlist profile: {str(e)}")
            return None
    
    def get_track_features(self, track_id: str) -> Optional[Dict[str, float]]:
        """Get audio features for a single track"""
        try:
            features = self.sp.audio_features([track_id])[0]
            if not features:
                return None
            
            return {
                'danceability': features['danceability'],
                'energy': features['energy'],
                'valence': features['valence'],
                'acousticness': features['acousticness'],
                'instrumentalness': features['instrumentalness'],
                'tempo': features['tempo'],
                'loudness': features['loudness'],
            }
        except Exception as e:
            logger.error(f"Error getting track features: {str(e)}")
            return None
    
    def calculate_similarity(self, track_features: Dict[str, float], 
                           playlist_profile: Dict[str, float]) -> float:
        """
        Calculate similarity score between track and playlist (0-1, higher is better)
        Uses weighted euclidean distance
        """
        # Weights for different features
        weights = {
            'danceability': 1.0,
            'energy': 1.0,
            'valence': 1.0,
            'acousticness': 0.8,
            'instrumentalness': 0.5,
            'tempo': 0.3,  # Normalized tempo difference
            'loudness': 0.3,  # Normalized loudness difference
        }
        
        # Calculate weighted squared differences
        total_diff = 0
        total_weight = 0
        
        for feature, weight in weights.items():
            if feature in track_features and feature in playlist_profile:
                track_val = track_features[feature]
                playlist_val = playlist_profile[feature]
                
                # Normalize tempo and loudness
                if feature == 'tempo':
                    # Tempo range is roughly 40-200 BPM
                    track_val = track_val / 200.0
                    playlist_val = playlist_val / 200.0
                elif feature == 'loudness':
                    # Loudness range is roughly -60 to 0 dB
                    track_val = (track_val + 60) / 60.0
                    playlist_val = (playlist_val + 60) / 60.0
                
                diff = (track_val - playlist_val) ** 2
                total_diff += diff * weight
                total_weight += weight
        
        if total_weight == 0:
            return 0
        
        # Convert distance to similarity (inverse, normalized to 0-1)
        distance = (total_diff / total_weight) ** 0.5
        similarity = max(0, 1 - distance)
        
        return similarity
    
    def find_best_playlist_match(self, track_id: str, 
                                 user_playlists: List[Dict[str, Any]],
                                 min_similarity: float = 0.6) -> Optional[Dict[str, Any]]:
        """
        Find the best matching playlist for a track
        Returns dict with playlist_id, playlist_name, and similarity score
        """
        try:
            # Get track features
            track_features = self.get_track_features(track_id)
            if not track_features:
                logger.warning(f"Could not get features for track {track_id}")
                return None
            
            best_match = None
            best_similarity = min_similarity
            
            # Compare against each playlist
            for playlist in user_playlists:
                playlist_id = playlist['id']
                playlist_name = playlist['name']
                
                # Skip playlists that are likely not user-created
                if playlist_name.lower() in ['liked songs', 'discover weekly', 'release radar']:
                    continue
                
                # Get playlist profile
                profile = self.get_playlist_profile(playlist_id)
                if not profile:
                    continue
                
                # Calculate similarity
                similarity = self.calculate_similarity(track_features, profile)
                
                logger.info(f"Similarity to '{playlist_name}': {similarity:.2f}")
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = {
                        'playlist_id': playlist_id,
                        'playlist_name': playlist_name,
                        'similarity': similarity
                    }
            
            return best_match
            
        except Exception as e:
            logger.error(f"Error finding best playlist match: {str(e)}")
            return None
