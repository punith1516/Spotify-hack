import { Play, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from './ui/Card'

const TrackCard = ({ track, onAdd }) => {
  const artists = Array.isArray(track.artists) 
    ? track.artists.join(', ') 
    : track.artist

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="flex items-center space-x-4 hover:scale-[1.02] cursor-pointer">
        {/* Album Art */}
        {track.album_art ? (
          <img
            src={track.album_art}
            alt={track.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
            <Play className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{track.name}</h3>
          <p className="text-gray-400 text-sm truncate">{artists}</p>
          {track.album && (
            <p className="text-gray-500 text-xs truncate">{track.album}</p>
          )}
        </div>

        {/* Add Button */}
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd(track)
            }}
            className="p-2 rounded-full bg-spotify-green text-black hover:bg-green-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </Card>
    </motion.div>
  )
}

export default TrackCard

