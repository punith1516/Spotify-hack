import { List, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from './ui/Card'

const PlaylistCard = ({ playlist, onClick }) => {
  const image = playlist.images?.[0]?.url

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card 
        className="cursor-pointer overflow-hidden"
        onClick={() => onClick && onClick(playlist)}
      >
        {/* Playlist Image */}
        <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <Music className="w-16 h-16 text-gray-500" />
            </div>
          )}
          
          {/* Track Count Badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
            <List className="w-3 h-3 text-spotify-green" />
            <span className="text-xs text-white">{playlist.tracks_total || 0}</span>
          </div>
        </div>

        {/* Playlist Info */}
        <div>
          <h3 className="text-white font-semibold truncate mb-1">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-gray-400 text-sm line-clamp-2 mb-2">
              {playlist.description}
            </p>
          )}
          {playlist.owner && (
            <p className="text-gray-500 text-xs">By {playlist.owner}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default PlaylistCard

