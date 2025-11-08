import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Music } from 'lucide-react'

const Callback = () => {
  const navigate = useNavigate()
  const { initAuth } = useAuthStore()

  useEffect(() => {
    console.log('🔔 Callback page loaded')
    console.log('📍 Full URL:', window.location.href)
    
    // Check if we have the token in URL params
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refreshToken = params.get('refresh_token')
    const spotifyId = params.get('spotify_id')
    const error = params.get('error')
    
    console.log('📦 URL Parameters:', { 
      hasToken: !!token, 
      hasRefreshToken: !!refreshToken, 
      hasSpotifyId: !!spotifyId, 
      error 
    })

    if (error) {
      console.error('❌ Authentication error:', error)
      alert('Authentication failed: ' + error)
      navigate('/')
      return
    }
    
    // If tokens are in URL, process them
    if (token && refreshToken && spotifyId) {
      console.log('✅ All tokens present, initializing auth...')
      initAuth()
      console.log('✅ Auth initialized, redirecting to dashboard...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
      return
    }
    
    // Check if tokens are already in localStorage (from previous load)
    const storedAuth = localStorage.getItem('spotify-auth')
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth)
        if (authData.state?.accessToken) {
          console.log('✅ Found stored tokens, redirecting to dashboard...')
          navigate('/dashboard')
          return
        }
      } catch (e) {
        console.error('Error parsing stored auth:', e)
      }
    }
    
    // No tokens anywhere, redirect to home
    console.error('❌ Missing tokens:', { token: !!token, refreshToken: !!refreshToken, spotifyId: !!spotifyId })
    console.log('Redirecting to home...')
    setTimeout(() => {
      navigate('/')
    }, 500)
  }, [navigate, initAuth])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Music className="w-16 h-16 text-spotify-green mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl text-white mb-2">Connecting to Spotify...</h2>
        <p className="text-gray-400">Please wait while we set things up</p>
      </div>
    </div>
  )
}

export default Callback

