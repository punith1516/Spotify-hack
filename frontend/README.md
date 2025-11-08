# Spotify Annoyance Fixer - Frontend

React + Vite frontend for the Spotify Annoyance Fixer application.

## Features

- ✅ Beautiful, modern UI with Tailwind CSS
- ✅ Aceternity-inspired UI components
- ✅ Spotify OAuth authentication
- ✅ Dashboard with stats and recent tracks
- ✅ Playlist management interface
- ✅ Queue save and replay functionality
- ✅ Responsive design for mobile and desktop
- ✅ Smooth animations with Framer Motion

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Setup

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Environment Variables**

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

3. **Run Development Server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API clients and services
│   │   ├── client.js     # Axios client with interceptors
│   │   └── spotify.js    # Spotify API methods
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── SpotifyGlow.jsx
│   │   │   └── BackgroundBeams.jsx
│   │   ├── Layout/       # Layout components
│   │   │   └── Navbar.jsx
│   │   ├── TrackCard.jsx
│   │   └── PlaylistCard.jsx
│   ├── pages/            # Page components
│   │   ├── Landing.jsx
│   │   ├── Callback.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Playlists.jsx
│   │   ├── Queues.jsx
│   │   └── Settings.jsx
│   ├── store/            # Zustand stores
│   │   └── authStore.js
│   ├── utils/            # Utility functions
│   │   └── cn.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Dependencies
```

## UI Components

### Aceternity-Inspired Components

- **SpotifyGlow**: Glowing background effect for emphasis
- **BackgroundBeams**: Animated beam effects for landing page
- **Button**: Multiple variants (primary, secondary, outline, ghost, danger)
- **Card**: Gradient cards with hover effects
- **Input**: Styled input fields with focus states

### Custom Components

- **TrackCard**: Display track information with album art
- **PlaylistCard**: Display playlist information with hover effects
- **Navbar**: Responsive navigation with active states

## Features Implemented

### 1. Authentication (Feature 1) ✅
- Spotify OAuth flow
- Token management with auto-refresh
- Persistent sessions

### 2. Fetch Songs (Feature 2) ✅
- Display liked songs
- Show recently played tracks
- Real-time data from Spotify API

### 3. Playlist CRUD (Feature 3) ✅
- View all playlists
- Create new playlists
- Edit playlist details
- Navigate to Spotify

### 4. Queue Management (Feature 4) ✅
- View current queue
- Save queues with custom names
- Replay saved queues
- Delete saved queues

### 5. OpenAI Integration (Feature 5) ✅
- Generate creative playlist names
- AI-powered suggestions

### 6. Playlist Refresh (Feature 6) ✅
- One-click playlist refresh
- Automatic updates

### 7. Auto Genre Sorting (Feature 7) ✅
- Settings toggle for auto-sort
- Genre-based organization

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
3. Deploy automatically on push to main

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set environment variables in Netlify dashboard

## Development Tips

- Hot reload is enabled by default
- Use Chrome DevTools for debugging
- Check console for API errors
- State persistence works across refreshes

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT

