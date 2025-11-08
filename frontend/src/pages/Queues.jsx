import { useState, useEffect } from 'react'
import { Clock, Plus, Save, Trash2, Edit2, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { spotifyAPI, queueAPI } from '@/api/spotify'
import { useAuthStore } from '@/store/authStore'

const Queues = () => {
  const { spotifyId } = useAuthStore()
  const [savedQueues, setSavedQueues] = useState([])
  const [currentQueue, setCurrentQueue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [queueName, setQueueName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load saved queues
      if (spotifyId) {
        const queuesData = await queueAPI.listQueues(spotifyId)
        setSavedQueues(queuesData.queues || [])
      }

      // Load current queue
      try {
        const currentQueueData = await spotifyAPI.getCurrentQueue()
        setCurrentQueue(currentQueueData)
      } catch (error) {
        console.log('No active playback')
      }
    } catch (error) {
      console.error('Error loading queues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQueue = async () => {
    if (!queueName.trim() || !currentQueue) return

    try {
      setSaving(true)
      const tracks = currentQueue.queue || []
      
      await queueAPI.saveQueue(queueName, tracks, spotifyId)
      
      // Reload saved queues
      await loadData()
      
      // Reset
      setQueueName('')
      setShowSaveModal(false)
    } catch (error) {
      console.error('Error saving queue:', error)
      alert('Failed to save queue')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQueue = async (queueId) => {
    if (!confirm('Are you sure you want to delete this queue?')) return

    try {
      await queueAPI.deleteQueue(queueId, spotifyId)
      await loadData()
    } catch (error) {
      console.error('Error deleting queue:', error)
      alert('Failed to delete queue')
    }
  }

  const handleReplayQueue = async (queue) => {
    // In a real implementation, you would add tracks to current queue
    alert('Replay feature: This would add all tracks from this queue to your current playback')
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
            <h1 className="text-4xl font-bold text-white mb-2">Queue Manager</h1>
            <p className="text-gray-400">Save and replay your favorite queues</p>
          </motion.div>

          {currentQueue && (
            <Button onClick={() => setShowSaveModal(true)}>
              <Save className="w-5 h-5 mr-2" />
              Save Current Queue
            </Button>
          )}
        </div>

        {/* Current Queue */}
        {currentQueue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-spotify-green" />
                Current Queue
              </h2>
              
              {currentQueue.currently_playing && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Now Playing</p>
                  <div className="flex items-center space-x-3">
                    {currentQueue.currently_playing.album_art && (
                      <img
                        src={currentQueue.currently_playing.album_art}
                        alt="Album"
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">{currentQueue.currently_playing.name}</p>
                      <p className="text-gray-400 text-sm">
                        {currentQueue.currently_playing.artists.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-400 mb-2">Up Next ({currentQueue.queue?.length || 0} tracks)</p>
                {currentQueue.queue?.slice(0, 10).map((track, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                    {track.album_art && (
                      <img src={track.album_art} alt="Album" className="w-10 h-10 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{track.name}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {track.artists.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Saved Queues */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Saved Queues</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedQueues.map((queue) => (
              <Card key={queue.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{queue.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {queue.tracks?.length || 0} tracks
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(queue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQueue(queue.id)}
                    className="text-red-500 hover:text-red-400 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={() => handleReplayQueue(queue)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Replay Queue
                </Button>
              </Card>
            ))}
          </div>

          {savedQueues.length === 0 && (
            <Card className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No saved queues</h3>
              <p className="text-gray-400">Save your current queue to replay it later</p>
            </Card>
          )}
        </motion.div>

        {/* Save Queue Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Save Queue</h2>
              
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Queue Name</label>
                <Input
                  placeholder="My Awesome Queue"
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowSaveModal(false)
                    setQueueName('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveQueue}
                  disabled={saving || !queueName.trim()}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Queues

