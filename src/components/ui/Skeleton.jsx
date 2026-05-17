export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-apple',
    chart: 'h-64 w-full rounded-apple',
    table: 'h-12 w-full',
  }

  return (
    <div
      className={`skeleton rounded ${variants[variant]} ${className}`}
    />
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-apple-bg rounded-t-apple">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-4 border-b border-apple-border-light">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-apple p-6 shadow-apple">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton variant="title" className="mb-4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-apple p-6 shadow-apple">
      <Skeleton className="h-6 w-1/4 mb-6" />
      <Skeleton variant="chart" />
    </div>
  )
}
