// Aceternity-inspired glowing effect component
import { motion } from 'framer-motion'

const SpotifyGlow = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Glowing background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500 via-green-600 to-emerald-500 rounded-2xl blur-2xl opacity-20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default SpotifyGlow

