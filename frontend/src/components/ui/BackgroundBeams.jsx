// Inspired by Aceternity UI's background beams effect
import { motion } from 'framer-motion'

const BackgroundBeams = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1DB954" stopOpacity="0" />
            <stop offset="50%" stopColor="#1DB954" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${i * 20}%`}
            y1="0%"
            x2={`${i * 20 + 50}%`}
            y2="100%"
            stroke="url(#beam-gradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default BackgroundBeams

