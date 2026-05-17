export function Input({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-apple-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-2.5 bg-apple-bg border-0 rounded-apple-sm text-gray-900 placeholder-apple-text-secondary focus:bg-white focus:ring-4 focus:ring-apple-blue/15 transition-all duration-200 ${error ? 'ring-2 ring-apple-red' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-apple-red mt-1">{error}</p>
      )}
    </div>
  )
}

export function Select({
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-apple-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 bg-apple-bg border-0 rounded-apple-sm text-gray-900 focus:bg-white focus:ring-4 focus:ring-apple-blue/15 transition-all duration-200 ${error ? 'ring-2 ring-apple-red' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-apple-red mt-1">{error}</p>
      )}
    </div>
  )
}

export function Textarea({
  label,
  error,
  rows = 3,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-apple-text-secondary uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-2.5 bg-apple-bg border-0 rounded-apple-sm text-gray-900 placeholder-apple-text-secondary focus:bg-white focus:ring-4 focus:ring-apple-blue/15 transition-all duration-200 resize-none ${error ? 'ring-2 ring-apple-red' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-apple-red mt-1">{error}</p>
      )}
    </div>
  )
}
