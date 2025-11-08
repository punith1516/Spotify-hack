#!/usr/bin/env python3
"""
Force user to re-authenticate by clearing their stored tokens
"""
from database import supabase
import sys

def clear_user_tokens(spotify_id):
    """Clear user's tokens from database to force re-auth"""
    try:
        # Get user
        result = supabase.table('users').select('*').eq('spotify_id', spotify_id).execute()
        
        if not result.data:
            print(f"❌ User {spotify_id} not found")
            return False
        
        user = result.data[0]
        print(f"Found user: {user.get('display_name')} ({spotify_id})")
        
        # Clear tokens (set to dummy values to force re-auth)
        supabase.table('users').update({
            'access_token': 'REVOKED',
            'refresh_token': 'REVOKED'
        }).eq('spotify_id', spotify_id).execute()
        
        print("✅ Tokens cleared from database!")
        print("⚠️  User must now log in again to get fresh tokens with new scopes")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python force_reauth.py SPOTIFY_USER_ID")
        print("\nYour Spotify ID: jxyvgnxfv9ak8mr39yk8wo6ra")
        sys.exit(1)
    
    spotify_id = sys.argv[1]
    clear_user_tokens(spotify_id)

