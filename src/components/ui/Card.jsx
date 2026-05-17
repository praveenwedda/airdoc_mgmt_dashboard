export function Card({ children, className = '', hover = false, padding = true }) {
  return (
    <div
      className={`bg-white rounded-apple border border-apple-border-light/50 shadow-apple ${hover ? 'card-hover cursor-pointer' : ''} ${padding ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function KPICard({ title, value, change, changeType = 'neutral', icon, subtitle }) {
  const changeColors = {
    positive: 'text-apple-green bg-green-50',
    negative: 'text-apple-red bg-red-50',
    neutral: 'text-apple-text-secondary bg-apple-bg',
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-apple-text-secondary uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-3xl font-semibold text-gray-900 tracking-heading">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-apple-text-secondary mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${changeColors[changeType]}`}>
              {changeType === 'positive' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {changeType === 'negative' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change}
            </span>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-apple-active-bg rounded-xl text-apple-blue">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
