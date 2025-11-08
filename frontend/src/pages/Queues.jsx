import { useState, useEffect } from 'react'
import { Clock, Plus, Save, Trash2, Edit2, Music, Eye, X, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [selectedQueue, setSelectedQueue] = useState(null)
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

  const handleViewQueue = async (queue) => {
    try {
      const fullQueue = await queueAPI.getQueue(queue.id)
      setSelectedQueue(fullQueue)
    } catch (error) {
      console.error('Error loading queue details:', error)
      alert('Failed to load queue details')
    }
  }

  const handleReplayQueue = async (queue) => {
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

  // Queue Detail View
  if (selectedQueue) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="outline"
              onClick={() => setSelectedQueue(null)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queues
            </Button>

            <Card>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">{selectedQueue.name}</h1>
                <p className="text-gray-400">
                  {selectedQueue.tracks?.length || 0} tracks • Created {new Date(selectedQueue.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-3">
                {selectedQueue.tracks?.map((track, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-gray-500 font-mono text-sm w-8">{index + 1}</span>
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm truncate">
                        {track.artists?.join(', ')}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {track.duration ? `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}` : ''}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // Main Queue List View
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
                <Music className="w-6 h-6 mr-2 text-spotify-green" />
                Current Queue
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentQueue.queue?.slice(0, 5).map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 bg-gray-800/30 rounded"
                  >
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-10 h-10 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {track.name}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {track.artists?.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
                {currentQueue.queue?.length > 5 && (
                  <p className="text-gray-500 text-sm text-center pt-2">
                    + {currentQueue.queue.length - 5} more tracks
                  </p>
                )}
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
          
          {savedQueues.length === 0 ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                No saved queues yet. Save your current queue to get started!
              </p>
            </Card>
          ) : (
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

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewQueue(queue)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleReplayQueue(queue)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Replay
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Save Queue Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Save Queue</h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <Input
                placeholder="Enter queue name..."
                value={queueName}
                onChange={(e) => setQueueName(e.target.value)}
                className="mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveQueue}
                  disabled={!queueName.trim() || saving}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Queue'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Queues
