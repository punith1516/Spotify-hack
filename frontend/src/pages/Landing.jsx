import { useState } from 'react'
import { Music, Sparkles, Zap, ListMusic } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import SpotifyGlow from '@/components/ui/SpotifyGlow'
import BackgroundBeams from '@/components/ui/BackgroundBeams'
import { spotifyAPI } from '@/api/spotify'

const Landing = () => {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { auth_url } = await spotifyAPI.login()
      window.location.href = auth_url
    } catch (error) {
      console.error('Login failed:', error)
      alert('Failed to initiate login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: ListMusic,
      title: 'Auto Genre Playlists',
      description: 'Automatically organize your liked songs into genre-based playlists',
    },
    {
      icon: Sparkles,
      title: 'Smart Queue Management',
      description: 'Save, name, and replay your favorite queues anytime',
    },
    {
      icon: Zap,
      title: 'One-Click Refresh',
      description: 'Update your playlists with the latest tracks automatically',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <BackgroundBeams />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <SpotifyGlow className="inline-block mb-8">
            <Music className="w-24 h-24 text-spotify-green" />
          </SpotifyGlow>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-green-200 to-spotify-green bg-clip-text text-transparent">
            Spotify Annoyance Fixer
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop manually organizing your music. Let AI and automation handle your Spotify playlists intelligently.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={loading}
              className="text-xl px-12 py-4 shadow-2xl shadow-spotify-green/50"
            >
              {loading ? 'Connecting...' : 'Connect with Spotify'}
            </Button>
          </motion.div>

          <p className="text-gray-500 text-sm mt-4">
            No credit card required. Free to use.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700 hover:border-spotify-green transition-all duration-300"
            >
              <feature.icon className="w-12 h-12 text-spotify-green mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', text: 'Connect Spotify' },
              { step: '2', text: 'Auto-organize songs' },
              { step: '3', text: 'Save custom queues' },
              { step: '4', text: 'Enjoy smart playlists' },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-spotify-green text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <p className="text-gray-300">{item.text}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-spotify-green to-transparent" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Landing

