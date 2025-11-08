from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from datetime import datetime
from database import supabase
from pydantic import BaseModel
import logging

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
    """Get a specific saved queue"""
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

