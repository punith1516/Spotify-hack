import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bell, Zap, Shield, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { spotifyAPI } from '@/api/spotify'
import { queueAPI } from '@/api/spotify'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'

const Settings = () => {
  const { spotifyId } = useAuthStore()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoSortEnabled, setAutoSortEnabled] = useState(false)
  const [checkingLikedSongs, setCheckingLikedSongs] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const userProfile = await spotifyAPI.getCurrentUser()
      setUser(userProfile)

      // Get auto-sort status
      if (spotifyId) {
        const status = await apiClient.get(`/queues/auto-sort-status/${spotifyId}`)
        setAutoSortEnabled(status.data.enabled)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAutoSort = async () => {
    try {
      const newState = !autoSortEnabled
      
      if (newState) {
        await apiClient.post('/queues/enable-auto-sort', null, {
          params: { spotify_id: spotifyId }
        })
        setAutoSortEnabled(true)
        
        // Start checking for newly liked songs
        startLikedSongsPolling()
      } else {
        await apiClient.post('/queues/disable-auto-sort', null, {
          params: { spotify_id: spotifyId }
        })
        setAutoSortEnabled(false)
        stopLikedSongsPolling()
      }
    } catch (error) {
      console.error('Error toggling auto-sort:', error)
      alert('Failed to update auto-sort setting')
    }
  }

  // Polling mechanism to detect newly liked songs
  let pollingInterval = null
  let lastLikedSongs = new Set()

  const startLikedSongsPolling = async () => {
    // Initialize with current liked songs
    try {
      const initial = await spotifyAPI.getLikedSongs(50, 0)
      lastLikedSongs = new Set(initial.tracks.map(t => t.id))
    } catch (error) {
      console.error('Error initializing liked songs:', error)
    }

    // Poll every 30 seconds
    pollingInterval = setInterval(async () => {
      try {
        const current = await spotifyAPI.getLikedSongs(50, 0)
        const currentIds = new Set(current.tracks.map(t => t.id))
        
        // Find new songs
        const newSongs = [...currentIds].filter(id => !lastLikedSongs.has(id))
        
        if (newSongs.length > 0) {
          console.log(`Found ${newSongs.length} new liked song(s)`)
          
          // Process each new song
          for (const trackId of newSongs) {
            await processNewLikedSong(trackId)
          }
        }
        
        lastLikedSongs = currentIds
      } catch (error) {
        console.error('Error polling liked songs:', error)
      }
    }, 30000) // Check every 30 seconds
  }

  const stopLikedSongsPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  const processNewLikedSong = async (trackId) => {
    try {
      console.log(`Processing new liked song: ${trackId}`)
      
      const result = await apiClient.post('/queues/smart-sort-track', null, {
        params: {
          track_id: trackId,
          spotify_id: spotifyId
        }
      })
      
      // Show notification
      if (result.data.action === 'added_to_existing') {
        showNotification(
          `🎵 Added "${result.data.track_name}" to "${result.data.playlist_name}"`,
          `Similarity: ${result.data.similarity * 100}%`
        )
      } else if (result.data.action === 'created_new_playlist') {
        showNotification(
          `✨ Created new playlist "${result.data.playlist_name}"`,
          `Added "${result.data.track_name}"`
        )
      }
    } catch (error) {
      console.error('Error processing new liked song:', error)
    }
  }

  const showNotification = (title, message) => {
    // Use browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message })
    } else {
      // Fallback to console log
      console.log(`${title}: ${message}`)
    }
  }

  // Request notification permission when auto-sort is enabled
  useEffect(() => {
    if (autoSortEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [autoSortEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLikedSongsPolling()
    }
  }, [])

  // Start polling if auto-sort is already enabled
  useEffect(() => {
    if (autoSortEnabled && spotifyId) {
      startLikedSongsPolling()
    }
    
    return () => {
      stopLikedSongsPolling()
    }
  }, [autoSortEnabled, spotifyId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Music className="w-12 h-12 text-spotify-green animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">Manage your preferences and account</p>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <User className="w-6 h-6 mr-2 text-spotify-green" />
              Profile
            </h2>
            
            <div className="flex items-center space-x-4">
              {user?.images?.[0] && (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div>
                <p className="text-white text-xl font-semibold">{user?.display_name}</p>
                <p className="text-gray-400">{user?.email}</p>
                <p className="text-gray-500 text-sm">
                  {user?.followers?.total} followers • {user?.product} account
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Automation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-spotify-green" />
              Automation
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex-1 mr-4">
                  <h3 className="text-white font-medium">Smart Auto-Sort on Like</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Automatically add newly liked songs to similar playlists based on audio analysis. 
                    Creates new playlists when no good match is found.
                  </p>
                  {autoSortEnabled && (
                    <p className="text-spotify-green text-xs mt-2 flex items-center">
                      <span className="w-2 h-2 bg-spotify-green rounded-full mr-2 animate-pulse"></span>
                      Actively monitoring for new liked songs
                    </p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={autoSortEnabled}
                    onChange={handleToggleAutoSort}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <Music className="w-4 h-4 mr-2" />
                  How Smart Auto-Sort Works
                </h4>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="text-spotify-green mr-2">1.</span>
                    <span>Analyzes audio features (energy, danceability, mood) of each newly liked song</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-spotify-green mr-2">2.</span>
                    <span>Compares with your existing playlists to find the best match (60%+ similarity)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-spotify-green mr-2">3.</span>
                    <span>Adds the song to the matching playlist, or creates a new categorized playlist</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-spotify-green mr-2">4.</span>
                    <span>Sends you a notification when a song is sorted (enable browser notifications)</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Bell className="w-6 h-6 mr-2 text-spotify-green" />
              Notifications
            </h2>
            
            <Button
              variant="outline"
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification('Notifications Enabled!', {
                        body: 'You\'ll now receive updates about auto-sorted songs.'
                      })
                    }
                  })
                }
              }}
            >
              Enable Browser Notifications
            </Button>
            <p className="text-gray-400 text-sm mt-2">
              Get notified when songs are automatically sorted into playlists
            </p>
          </Card>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-spotify-green" />
              Privacy & Data
            </h2>
            
            <p className="text-gray-400 mb-4">
              Your Spotify data is accessed only to provide smart playlist management features. 
              We don't store your music preferences or share your data with third parties.
            </p>
            
            <Button variant="danger">
              Disconnect Spotify Account
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
