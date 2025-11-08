import { useState, useEffect } from 'react'
import { Music, TrendingUp, Heart, Clock, Zap, RefreshCw, ListMusic } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Layout/Navbar'
import Card from '@/components/ui/Card'
import TrackCard from '@/components/TrackCard'
import Button from '@/components/ui/Button'
import { spotifyAPI, queueAPI } from '@/api/spotify'
import { automationAPI } from '@/api/automation'
import { useAuthStore } from '@/store/authStore'

const Dashboard = () => {
  const { spotifyId } = useAuthStore()
  const [user, setUser] = useState(null)
  const [recentTracks, setRecentTracks] = useState([])
  const [likedCount, setLikedCount] = useState(0)
  const [playlistCount, setPlaylistCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [autoSorting, setAutoSorting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [savingQueue, setSavingQueue] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load user profile
      const userProfile = await spotifyAPI.getCurrentUser()
      setUser(userProfile)

      // Load recently played tracks
      const recentData = await spotifyAPI.getRecentlyPlayed(10)
      setRecentTracks(recentData.tracks || [])

      // Load liked songs count
      const likedData = await spotifyAPI.getLikedSongs(1, 0)
      setLikedCount(likedData.total || 0)

      // Load playlists count
      const playlistData = await spotifyAPI.getPlaylists(1, 0)
      setPlaylistCount(playlistData.total || 0)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSort = async () => {
    if (!spotifyId) return
    try {
      setAutoSorting(true)
      const result = await automationAPI.autoSortSongs(spotifyId, 50)
      alert(`Success! Sorted ${result.results?.length || 0} songs into genre playlists.`)
      await loadDashboardData()
    } catch (error) {
      console.error('Error auto-sorting:', error)
      alert('Failed to auto-sort songs. Please try again.')
    } finally {
      setAutoSorting(false)
    }
  }

  const handleRefreshPlaylists = async () => {
    if (!spotifyId) return
    try {
      setRefreshing(true)
      const result = await automationAPI.refreshAllPlaylists(spotifyId)
      alert(`Success! Refreshed ${result.results?.length || 0} playlists.`)
      await loadDashboardData()
    } catch (error) {
      console.error('Error refreshing playlists:', error)
      alert('Failed to refresh playlists. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveCurrentQueue = async () => {
    if (!spotifyId) return
    try {
      setSavingQueue(true)
      const queue = await spotifyAPI.getCurrentQueue()
      
      if (!queue.queue || queue.queue.length === 0) {
        alert('No active queue found. Start playing music first!')
        return
      }

      const queueName = prompt('Enter a name for this queue:')
      if (!queueName) return

      await queueAPI.saveQueue(queueName, queue.queue, spotifyId)
      alert(`Queue "${queueName}" saved successfully!`)
    } catch (error) {
      console.error('Error saving queue:', error)
      alert('Failed to save queue. Make sure you have an active playback.')
    } finally {
      setSavingQueue(false)
    }
  }

  const stats = [
    { icon: Heart, label: 'Liked Songs', value: likedCount, color: 'text-red-500' },
    { icon: Music, label: 'Playlists', value: playlistCount, color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Recent Plays', value: recentTracks.length, color: 'text-green-500' },
  ]

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back{user?.display_name ? `, ${user.display_name}` : ''}!
          </h1>
          <p className="text-gray-400">Here's what's happening with your music</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="flex items-center space-x-4">
                <div className={`p-4 rounded-full bg-gray-800 ${stat.color}`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-spotify-green" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleAutoSort}
                disabled={autoSorting}
              >
                <ListMusic className="w-5 h-5 mr-2" />
                {autoSorting ? 'Sorting...' : 'Auto-Sort Liked Songs'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRefreshPlaylists}
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh All Playlists'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSaveCurrentQueue}
                disabled={savingQueue}
              >
                <Clock className="w-5 h-5 mr-2" />
                {savingQueue ? 'Saving...' : 'Save Current Queue'}
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                💡 <strong>Tip:</strong> Auto-Sort analyzes your liked songs and organizes them into genre-based playlists automatically!
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Recently Played */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Clock className="w-6 h-6 mr-2 text-spotify-green" />
              Recently Played
            </h2>
          </div>
          
          <div className="space-y-3">
            {recentTracks.slice(0, 5).map((track, index) => (
              <TrackCard key={`${track.id}-${index}`} track={track} />
            ))}
          </div>

          {recentTracks.length === 0 && (
            <Card>
              <p className="text-gray-400 text-center py-8">
                No recently played tracks found. Start listening!
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard

