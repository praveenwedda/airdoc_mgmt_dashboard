// Format currency in AUD
export function formatCurrency(value) {
  if (value === null || value === undefined) return 'A$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('$', 'A$')
}

// Format currency with decimals
export function formatCurrencyPrecise(value) {
  if (value === null || value === undefined) return 'A$0.00'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('$', 'A$')
}

// Format large numbers
export function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-AU').format(value)
}

// Format percentage
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '0%'
  return `${Number(value).toFixed(decimals)}%`
}

// Format date
export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Format date with time
export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Format relative time (e.g., "2 days ago")
export function formatRelativeTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

  return formatDate(dateString)
}

// Get month name
export function getMonthName(monthIndex, short = false) {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[monthIndex]
}

// Get ISO date string for today
export function getTodayISO() {
  return new Date().toISOString().split('T')[0]
}

// Get first day of current month
export function getFirstDayOfMonth() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

// Get last day of current month
export function getLastDayOfMonth() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
}
