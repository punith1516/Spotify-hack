import { cn } from '@/utils/cn'

const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-all',
        className
      )}
      {...props}
    />
  )
}

export default Input

