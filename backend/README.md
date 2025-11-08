# Spotify Annoyance Fixer - Backend API

FastAPI backend for the Spotify Annoyance Fixer application.

## Features

- ✅ Spotify OAuth authentication
- ✅ Fetch liked songs and recently played tracks
- ✅ Playlist management (CRUD operations)
- ✅ Save and replay queue functionality
- ✅ Auto-genre based playlist sorting
- ✅ Smart playlist refresher
- ✅ OpenAI integration for playlist naming (optional)

## Tech Stack

- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Spotify OAuth 2.0
- **Background Tasks**: APScheduler
- **AI**: OpenAI API (optional)

## Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Environment Variables**

Create a `.env` file in the backend directory:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

OPENAI_API_KEY=your_openai_api_key  # Optional

SECRET_KEY=your_secret_key_for_jwt
FRONTEND_URL=http://localhost:5173
```

3. **Spotify App Setup**

- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Create a new app
- Add `http://localhost:8000/callback` to Redirect URIs
- Copy Client ID and Client Secret to `.env`

4. **Supabase Setup**

- Create a new project on [Supabase](https://supabase.com)
- Run the SQL schema from `schema.sql` in the SQL editor
- Copy the project URL and anon key to `.env`

5. **Run the Server**

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate Spotify OAuth
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

### Spotify Data
- `GET /spotify/liked-songs` - Get user's liked songs
- `GET /spotify/recently-played` - Get recently played tracks
- `GET /spotify/playlists` - Get user's playlists
- `GET /spotify/playlist/{id}` - Get specific playlist
- `GET /spotify/queue` - Get current playback queue
- `POST /spotify/playlist/create` - Create new playlist
- `POST /spotify/playlist/{id}/tracks` - Add tracks to playlist
- `GET /spotify/track/{id}/features` - Get track audio features

### Queue Management
- `POST /queues/save` - Save current queue
- `GET /queues/list/{spotify_id}` - List saved queues
- `GET /queues/{id}` - Get specific queue
- `PUT /queues/{id}` - Update queue name
- `DELETE /queues/{id}` - Delete queue

### AI Features
- `POST /ai/generate-playlist-name` - Generate creative playlist name
- `POST /ai/suggest-genre` - Suggest genre for track

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Configuration settings
├── database.py            # Supabase client setup
├── models.py              # Pydantic models
├── requirements.txt       # Python dependencies
├── schema.sql            # Database schema
├── routers/
│   ├── auth.py           # Authentication routes
│   ├── spotify.py        # Spotify API routes
│   ├── queues.py         # Queue management routes
│   └── ai.py             # AI integration routes
└── services/
    ├── auto_genre_sorter.py    # Auto genre sorting service
    └── playlist_refresher.py   # Playlist refresh service
```

## Development

Run with auto-reload:
```bash
uvicorn main:app --reload --port 8000
```

## Deployment

### Render.com / Railway

1. Connect your GitHub repository
2. Set environment variables
3. Deploy command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Docker (Optional)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

