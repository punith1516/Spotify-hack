#!/usr/bin/env python3
"""
Quick script to check what scopes a Spotify access token has
"""
import sys
import spotipy
from spotipy.oauth2 import SpotifyOAuth

def check_token_scopes(access_token):
    """Check what the token can access"""
    sp = spotipy.Spotify(auth=access_token)
    
    print("\n🔍 Testing Token Permissions:\n")
    
    tests = [
        ("✅ User Profile", lambda: sp.current_user()),
        ("✅ Recently Played", lambda: sp.current_user_recently_played(limit=1)),
        ("✅ Liked Songs", lambda: sp.current_user_saved_tracks(limit=1)),
        ("✅ Playlists", lambda: sp.current_user_playlists(limit=1)),
        ("❓ Queue (NEW)", lambda: sp.queue()),
    ]
    
    for name, test_func in tests:
        try:
            test_func()
            print(f"{name} - ✅ WORKS")
        except Exception as e:
            if "403" in str(e) or "Forbidden" in str(e):
                print(f"{name} - ❌ FORBIDDEN (missing scope)")
            else:
                print(f"{name} - ⚠️  ERROR: {e}")
    
    print("\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_token.py YOUR_ACCESS_TOKEN")
        sys.exit(1)
    
    token = sys.argv[1]
    check_token_scopes(token)

