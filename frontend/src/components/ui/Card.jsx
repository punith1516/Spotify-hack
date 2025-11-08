import { cn } from '@/utils/cn'

const Card = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

