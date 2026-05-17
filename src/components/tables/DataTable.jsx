import { TableSkeleton } from '../ui/Skeleton'
import { TableEmptyState } from '../ui/EmptyState'

export function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
  actions,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-apple border border-apple-border-light/50 shadow-apple overflow-hidden">
        <TableSkeleton rows={5} columns={columns.length} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-apple border border-apple-border-light/50 shadow-apple overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-apple-bg border-b border-apple-border-light">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-semibold text-apple-text-secondary uppercase tracking-wide ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-apple-text-secondary uppercase tracking-wide w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-border-light">
            {data.length === 0 ? (
              <TableEmptyState title={emptyMessage} colSpan={columns.length + (actions ? 1 : 0)} />
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-apple-bg/50' : ''} transition-colors`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ActionButton({ onClick, variant = 'default', children, title }) {
  const variants = {
    default: 'text-apple-text-secondary hover:text-gray-900 hover:bg-apple-bg',
    edit: 'text-apple-blue hover:text-blue-700 hover:bg-apple-active-bg',
    delete: 'text-apple-red hover:text-red-700 hover:bg-red-50',
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={title}
      className={`p-2 rounded-lg transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

export function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

export function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
