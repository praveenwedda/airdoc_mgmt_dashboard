export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-apple-blue/30 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-apple-blue text-white hover:bg-apple-blue-hover active:scale-[0.98]',
    secondary: 'bg-apple-bg text-apple-text-secondary border border-apple-border hover:bg-gray-100',
    danger: 'bg-apple-red text-white hover:bg-red-600 active:scale-[0.98]',
    ghost: 'text-apple-blue hover:bg-apple-active-bg',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const radiusClass = pill ? 'rounded-apple-pill' : 'rounded-apple-sm'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${radiusClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}
