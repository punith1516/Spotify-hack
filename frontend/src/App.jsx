import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Callback from './pages/Callback'
import Playlists from './pages/Playlists'
import Queues from './pages/Queues'
import Settings from './pages/Settings'

function App() {
  const { user, accessToken, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Check if user is authenticated (has access token)
  const isAuthenticated = !!accessToken

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/playlists"
          element={isAuthenticated ? <Playlists /> : <Navigate to="/" />}
        />
        <Route
          path="/queues"
          element={isAuthenticated ? <Queues /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  )
}

export default App

