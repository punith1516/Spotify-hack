import { useState, useEffect } from 'react'
import { Music, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PlaylistCard from '@/components/PlaylistCard'
import { spotifyAPI, aiAPI } from '@/api/spotify'

const Playlists = () => {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      const data = await spotifyAPI.getPlaylists(50, 0)
      setPlaylists(data.playlists || [])
    } catch (error) {
      console.error('Error loading playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      setCreating(true)
      await spotifyAPI.createPlaylist(newPlaylistName, newPlaylistDesc, false)
      
      // Reload playlists
      await loadPlaylists()
      
      // Reset form
      setNewPlaylistName('')
      setNewPlaylistDesc('')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating playlist:', error)
      alert('Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  const handleGenerateAIName = async () => {
    try {
      const response = await aiAPI.generatePlaylistName(
        ['Sample Track'],
        null,
        'Mixed'
      )
      setNewPlaylistName(response.name)
    } catch (error) {
      console.error('Error generating name:', error)
    }
  }

  const handleRefreshPlaylists = async () => {
    setRefreshing(true)
    await loadPlaylists()
    setRefreshing(false)
  }

  const handlePlaylistClick = (playlist) => {
    // Open in Spotify
    window.open(`https://open.spotify.com/playlist/${playlist.id}`, '_blank')
  }

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">Your Playlists</h1>
            <p className="text-gray-400">Manage and organize your Spotify playlists</p>
          </motion.div>

          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={handleRefreshPlaylists}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Playlist
            </Button>
          </div>
        </div>

        {/* Playlists Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={handlePlaylistClick}
            />
          ))}
        </motion.div>

        {playlists.length === 0 && (
          <Card className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No playlists found</h3>
            <p className="text-gray-400 mb-6">Create your first playlist to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Playlist
            </Button>
          </Card>
        )}

        {/* Create Playlist Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Create New Playlist</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Playlist Name</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="My Awesome Playlist"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateAIName}
                      title="Generate AI name"
                    >
                      <Sparkles className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description (Optional)</label>
                  <Input
                    placeholder="Describe your playlist..."
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewPlaylistName('')
                    setNewPlaylistDesc('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePlaylist}
                  disabled={creating || !newPlaylistName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Playlists

