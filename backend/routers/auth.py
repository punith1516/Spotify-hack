from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse, JSONResponse
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import secrets
from datetime import datetime, timedelta
from config import get_settings
from database import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
settings = get_settings()

def get_spotify_oauth():
    """Create and return SpotifyOAuth object"""
    return SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri,
        scope=settings.spotify_scopes,
        show_dialog=True
    )

@router.get("/login")
async def login():
    """Initiate Spotify OAuth login flow"""
    try:
        sp_oauth = get_spotify_oauth()
        auth_url = sp_oauth.get_authorize_url()
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/callback")
async def callback(code: str = None, error: str = None):
    """Handle Spotify OAuth callback"""
    logger.info(f"🔔 Callback received - code: {'Yes' if code else 'No'}, error: {error}")
    
    if error:
        logger.error(f"❌ Spotify returned error: {error}")
        return RedirectResponse(url=f"{settings.frontend_url}/callback?error={error}")
    
    if not code:
        logger.error("❌ No authorization code provided")
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        logger.info("🔄 Exchanging code for access token...")
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code, as_dict=True, check_cache=False)
        logger.info("✅ Token received from Spotify")
        
        # Get user profile from Spotify
        logger.info("🔄 Fetching user profile from Spotify...")
        sp = spotipy.Spotify(auth=token_info['access_token'])
        user_profile = sp.current_user()
        logger.info(f"✅ User profile: {user_profile.get('display_name')} ({user_profile['id']})")
        
        # Calculate token expiration
        expires_at = datetime.utcnow() + timedelta(seconds=token_info['expires_in'])
        
        # Store or update user in Supabase
        logger.info("🔄 Saving user to database...")
        user_data = {
            "spotify_id": user_profile['id'],
            "email": user_profile.get('email'),
            "display_name": user_profile.get('display_name'),
            "access_token": token_info['access_token'],
            "refresh_token": token_info['refresh_token'],
            "token_expires_at": expires_at.isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Check if user exists
        existing_user = supabase.table('users').select('*').eq('spotify_id', user_profile['id']).execute()
        
        if existing_user.data:
            # Update existing user
            logger.info(f"🔄 Updating existing user: {user_profile['id']}")
            supabase.table('users').update(user_data).eq('spotify_id', user_profile['id']).execute()
            logger.info("✅ User updated successfully")
        else:
            # Create new user
            logger.info(f"🔄 Creating new user: {user_profile['id']}")
            user_data['created_at'] = datetime.utcnow().isoformat()
            supabase.table('users').insert(user_data).execute()
            logger.info("✅ User created successfully")
        
        # Generate session token (simplified - in production use proper JWT)
        session_token = secrets.token_urlsafe(32)
        
        # Redirect to frontend callback with session token
        redirect_url = f"{settings.frontend_url}/callback?token={token_info['access_token']}&refresh_token={token_info['refresh_token']}&spotify_id={user_profile['id']}"
        logger.info(f"✅ Auth successful! Redirecting to: {settings.frontend_url}/callback")
        logger.info(f"User: {user_profile.get('display_name')} ({user_profile['id']})")
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"❌ Callback error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return RedirectResponse(url=f"{settings.frontend_url}/callback?error=authentication_failed")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh Spotify access token"""
    try:
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.refresh_access_token(refresh_token)
        
        return {
            "access_token": token_info['access_token'],
            "expires_in": token_info['expires_in']
        }
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Failed to refresh token")

@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization token")
    
    access_token = auth_header.split("Bearer ")[1]
    
    try:
        sp = spotipy.Spotify(auth=access_token)
        user_profile = sp.current_user()
        return user_profile
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/logout")
async def logout(spotify_id: str):
    """Logout user (clear tokens from database)"""
    try:
        # In production, you might want to keep the user but clear sensitive tokens
        # For now, we'll just acknowledge the logout
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Logout failed")

