import { Card } from '../ui/Card'
import { ChartSkeleton } from '../ui/Skeleton'
import { ChartEmptyState } from '../ui/EmptyState'

export function ChartWrapper({ title, children, loading = false, isEmpty = false, height = 300 }) {
  if (loading) {
    return <ChartSkeleton />
  }

  return (
    <Card>
      {title && (
        <h3 className="text-base font-semibold text-gray-900 tracking-heading mb-4">
          {title}
        </h3>
      )}
      {isEmpty ? (
        <ChartEmptyState />
      ) : (
        <div style={{ height }}>
          {children}
        </div>
      )}
    </Card>
  )
}
