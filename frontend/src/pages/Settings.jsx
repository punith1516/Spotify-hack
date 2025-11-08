import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Zap, Shield, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { spotifyAPI } from '@/api/spotify'
import { useAuthStore } from '@/store/authStore'

const Settings = () => {
  const { user: authUser, logout } = useAuthStore()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await spotifyAPI.getCurrentUser()
      setUser(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </motion.div>

        {/* User Profile */}
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
            
            <div className="flex items-center space-x-4 mb-6">
              {user?.images?.[0]?.url ? (
                <img
                  src={user.images[0].url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {user?.display_name || 'Spotify User'}
                </h3>
                <p className="text-gray-400">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  {user?.followers?.total || 0} followers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Country</p>
                <p className="text-white">{user?.country || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Product</p>
                <p className="text-white capitalize">{user?.product || 'Free'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Auto Features */}
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
                <div>
                  <h3 className="text-white font-medium">Auto Genre Sorting</h3>
                  <p className="text-gray-400 text-sm">
                    Automatically sort liked songs into genre playlists
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Auto Playlist Refresh</h3>
                  <p className="text-gray-400 text-sm">
                    Automatically refresh playlists with new matching songs
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-red-900/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-red-500" />
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <h3 className="text-white font-medium mb-2">Disconnect Spotify</h3>
                <p className="text-gray-400 text-sm mb-4">
                  This will log you out and remove your session
                </p>
                <Button variant="danger" onClick={logout}>
                  Disconnect Account
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings

