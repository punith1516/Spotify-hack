import { cn } from '@/utils/cn'

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  ...props 
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-spotify-green text-black hover:bg-green-400 hover:scale-105',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600',
    outline: 'border-2 border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-black',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-white hover:bg-gray-800'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button

