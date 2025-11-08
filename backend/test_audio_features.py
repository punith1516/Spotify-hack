#!/usr/bin/env python3
"""
Test script to check audio features access
"""
import sys
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from config import get_settings

settings = get_settings()

def test_audio_features(access_token):
    """Test if we can access audio features"""
    sp = spotipy.Spotify(auth=access_token)
    
    print("\n" + "="*60)
    print("🎵 AUDIO FEATURES API TEST")
    print("="*60 + "\n")
    
    # Test with a well-known track (Blinding Lights by The Weeknd)
    test_track_id = "0VjIjW4GlUZAMYd2vXMi3b"
    
    print("1️⃣ Testing with popular track (Blinding Lights)...")
    try:
        features = sp.audio_features([test_track_id])
        if features and features[0]:
            print("✅ Audio Features API is WORKING!")
            print(f"   Energy: {features[0].get('energy')}")
            print(f"   Danceability: {features[0].get('danceability')}")
            print(f"   Tempo: {features[0].get('tempo')}")
            return True
        else:
            print("⚠️  API returned empty response")
            return False
    except Exception as e:
        print(f"❌ Audio Features API FAILED: {e}")
        if "403" in str(e):
            print("\n💡 This is a 403 Forbidden error.")
            print("   Possible causes:")
            print("   1. ❌ Market restrictions (track not available in your region)")
            print("   2. ❌ API access tier limitations")
            print("   3. ❌ Token doesn't have proper permissions")
        return False

def check_scopes_and_token(access_token):
    """Check token info"""
    sp = spotipy.Spotify(auth=access_token)
    
    print("\n2️⃣ Checking token validity...")
    try:
        user = sp.current_user()
        print(f"✅ Token is valid for user: {user['display_name']}")
        print(f"   Product: {user.get('product')} (Premium: {user.get('product') == 'premium'})")
        print(f"   Country: {user.get('country')}")
    except Exception as e:
        print(f"❌ Token check failed: {e}")

if __name__ == "__main__":
    print("\n📋 Current Scopes Configured:")
    print(f"   {settings.spotify_scopes}")
    
    if len(sys.argv) < 2:
        print("\n❌ Usage: python test_audio_features.py YOUR_ACCESS_TOKEN")
        print("\nGet your token from browser console:")
        print("  JSON.parse(localStorage.getItem('spotify-auth')).state.accessToken")
        sys.exit(1)
    
    token = sys.argv[1]
    check_scopes_and_token(token)
    test_audio_features(token)
    
    print("\n" + "="*60)
    print("💡 DIAGNOSIS:")
    print("="*60)
    print("""
If audio features work with test track but not your tracks:
  → Market/region restrictions on your specific tracks
  
If audio features don't work at all:
  → May need Spotify Premium for audio features API
  → Or token needs refresh with proper app permissions
  
Note: According to Spotify docs, audio features should NOT
require special scopes, just a valid access token.
    """)

