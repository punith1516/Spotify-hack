#!/usr/bin/env python3
"""
Debug script to check token scopes and queue access
"""
import sys
import requests
import json

def check_token_detailed(access_token):
    """Check token scopes and queue access in detail"""
    
    print("\n" + "="*60)
    print("🔍 SPOTIFY TOKEN DEBUGGER")
    print("="*60 + "\n")
    
    # Test 1: Get current user (should always work)
    print("1️⃣ Testing Basic Auth...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get("https://api.spotify.com/v1/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print(f"   ✅ Authenticated as: {user.get('display_name')} ({user.get('id')})")
            print(f"   📧 Email: {user.get('email')}")
            print(f"   🎵 Product: {user.get('product')} (Premium required for queue!)")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Check playback state
    print("\n2️⃣ Testing Playback State...")
    try:
        response = requests.get("https://api.spotify.com/v1/me/player", headers=headers)
        if response.status_code == 200:
            playback = response.json()
            if playback:
                print(f"   ✅ Active playback detected")
                print(f"   🎵 Playing: {playback.get('item', {}).get('name')}")
                print(f"   📱 Device: {playback.get('device', {}).get('name')}")
            else:
                print("   ⚠️  No active playback (start playing music first!)")
        elif response.status_code == 204:
            print("   ⚠️  No active device or playback")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Try to access queue
    print("\n3️⃣ Testing Queue Access...")
    try:
        response = requests.get("https://api.spotify.com/v1/me/player/queue", headers=headers)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            queue_data = response.json()
            print(f"   ✅ QUEUE ACCESS WORKS!")
            print(f"   📝 Queue items: {len(queue_data.get('queue', []))}")
        elif response.status_code == 403:
            print(f"   ❌ FORBIDDEN - Missing scope or not Premium")
            error = response.json()
            print(f"   Error details: {json.dumps(error, indent=2)}")
        elif response.status_code == 204:
            print(f"   ⚠️  No content - might mean no active playback")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Recently played (should work)
    print("\n4️⃣ Testing Recently Played...")
    try:
        response = requests.get("https://api.spotify.com/v1/me/player/recently-played?limit=1", headers=headers)
        if response.status_code == 200:
            print(f"   ✅ Recently played works")
        else:
            print(f"   ❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "="*60)
    print("💡 DIAGNOSIS:")
    print("="*60)
    print("""
If queue shows 403 FORBIDDEN:
  1. ❌ Your Spotify account is FREE (not Premium)
     → Queue API requires Spotify Premium!
  2. ❌ Missing scope in token
     → Need to re-authenticate with new scopes
  3. ❌ No active playback
     → Start playing music in Spotify first

If queue shows 204 NO CONTENT:
  → Start playing music in Spotify app
    """)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_token.py YOUR_ACCESS_TOKEN")
        print("\nGet your token from browser console:")
        print("  JSON.parse(localStorage.getItem('spotify-auth')).state.accessToken")
        sys.exit(1)
    
    token = sys.argv[1]
    check_token_detailed(token)

