// Calculate MRR from active customers and packages
export function calculateMRR(activeCustomersByPackage, packages) {
  if (!activeCustomersByPackage || !packages) return 0

  return Object.entries(activeCustomersByPackage).reduce((total, [packageId, count]) => {
    const pkg = packages.find(p => p.id === packageId)
    if (pkg && pkg.active) {
      return total + (count * pkg.monthlyPrice)
    }
    return total
  }, 0)
}

// Calculate churn rate against all customers exposed during the month.
// "Exposed" = customers present at the start of the month plus any acquired
// during the month. This avoids the degenerate case where churning the only
// pre-existing customer reads as 100% even when several new customers
// joined the same month.
//   churn / (startOfMonthCustomers + acquisitions) * 100
export function calculateChurnRate(churned, startOfMonthCustomers, acquisitions = 0) {
  const denom = (startOfMonthCustomers || 0) + (acquisitions || 0)
  if (denom <= 0) return 0
  return ((churned || 0) / denom) * 100
}

// Pick the applicable monthly target for (month, year) in priority order:
// specific match → range match → 'all' default. Returns null if none.
export function findApplicableTarget(monthlyTargets, month, year) {
  if (!Array.isArray(monthlyTargets) || monthlyTargets.length === 0) return null
  const specific = monthlyTargets.find(t =>
    t?.periodType === 'specific' &&
    Number(t.startMonth) === month &&
    Number(t.startYear) === year
  )
  if (specific) return specific
  const currKey = year * 12 + month
  const range = monthlyTargets.find(t => {
    if (t?.periodType !== 'range') return false
    const startKey = Number(t.startYear) * 12 + Number(t.startMonth)
    const endKey = Number(t.endYear) * 12 + Number(t.endMonth)
    return currKey >= startKey && currKey <= endKey
  })
  if (range) return range
  return monthlyTargets.find(t => t?.periodType === 'all') || null
}

// Sum of per-package customer targets in a target record.
export function sumPackageTargets(target) {
  return (target?.packageTargets || []).reduce(
    (sum, pt) => sum + (Number(pt?.target) || 0),
    0
  )
}

// Calculate growth percentage
export function calculateGrowthPercentage(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Calculate net customer change
export function calculateNetChange(acquisitions, churn) {
  return (acquisitions || 0) - (churn || 0)
}

// Calculate campaign response rate
export function calculateResponseRate(responses, delivered) {
  if (!delivered || delivered === 0) return 0
  return (responses / delivered) * 100
}

// Calculate open rate (for email campaigns)
export function calculateOpenRate(delivered, reached) {
  if (!reached || reached === 0) return 0
  return (delivered / reached) * 100
}

// Calculate total variable costs
export function calculateVariableCosts(variableCosts, costConfig) {
  if (!variableCosts || !costConfig) return 0

  return variableCosts.reduce((total, cost) => {
    const config = costConfig.find(c => c.name === cost.name)
    if (config) {
      return total + (cost.units * config.unitCost)
    }
    return total + (cost.total || 0)
  }, 0)
}

// Calculate total costs for a month
export function calculateTotalCosts(fixedCosts, variableCosts, adHocCosts) {
  const fixed = fixedCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
  const variable = variableCosts?.reduce((sum, c) => sum + (c.total || 0), 0) || 0
  const adHoc = adHocCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
  return fixed + variable + adHoc
}

// Calculate gross margin
export function calculateGrossMargin(revenue, costs) {
  if (!revenue || revenue === 0) return 0
  return ((revenue - costs) / revenue) * 100
}

// Group data by month
export function groupByMonth(data, dateField = 'date') {
  const grouped = {}

  data.forEach(item => {
    if (!item[dateField]) return
    const date = new Date(item[dateField])
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(item)
  })

  return grouped
}

// Earliest month the dashboard has meaningful data for. Chart X-axes never
// extend further back than this — anything earlier predates go-live and
// would just be empty noise on screen.
export const GO_LIVE = { year: 2026, month: 4 } // April 2026

// Get last N months ending at the current month, clamped so the series
// never starts earlier than GO_LIVE.
export function getLastNMonths(n) {
  const months = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const currentKey = currentYear * 12 + currentMonth
  const requestedStartKey = currentKey - (n - 1)
  const goLiveKey = GO_LIVE.year * 12 + GO_LIVE.month
  const startKey = Math.max(requestedStartKey, goLiveKey)

  for (let key = startKey; key <= currentKey; key++) {
    const year = Math.floor((key - 1) / 12)
    const month = ((key - 1) % 12) + 1
    const date = new Date(year, month - 1, 1)
    months.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
      year,
      month,
    })
  }

  return months
}

// Build a YYYY-MM key from any ISO date string
function monthKey(dateStr) {
  if (!dateStr) return null
  // Already YYYY-MM-DD: just take the first 7 chars
  return dateStr.length >= 7 ? dateStr.slice(0, 7) : null
}

// Compute linked costs for a given (month, year) by aggregating
// marketing spend recorded in other parts of the app.
// Returns an array of { name, amount, source, category } items.
export function computeLinkedCosts(month, year, campaigns = [], socialCampaigns = []) {
  const key = `${year}-${String(month).padStart(2, '0')}`
  const items = []

  campaigns.forEach(c => {
    if (!c?.startDate) return
    if (monthKey(c.startDate) !== key) return
    if (!c.cost || c.cost <= 0) return
    items.push({
      name: c.name || (c.type === 'sms' ? 'SMS Campaign' : 'Email Campaign'),
      amount: Number(c.cost) || 0,
      source: c.type === 'sms' ? 'sms_campaign' : 'email_campaign',
      category: 'Marketing',
      sourceId: c.id,
    })
  })

  socialCampaigns.forEach(s => {
    if (!s?.date) return
    if (monthKey(s.date) !== key) return
    if (!s.spend || s.spend <= 0) return
    items.push({
      name: s.campaignName || 'Social Media Ad',
      amount: Number(s.spend) || 0,
      source: 'social_media',
      category: `Social Media${s.platform ? ` (${s.platform})` : ''}`,
      sourceId: s.id,
    })
  })

  return items
}

// Sum helper for a cost record's manual entries
export function sumManualCosts(record) {
  if (!record) return { fixed: 0, variable: 0, adHoc: 0 }
  const fixed = (record.fixedCosts || []).reduce((s, c) => s + (Number(c.actual) || 0), 0)
  const variable = (record.variableCosts || []).reduce((s, c) => s + (Number(c.total) || 0), 0)
  const adHoc = (record.adHocCosts || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
  return { fixed, variable, adHoc }
}

// Sum linked items
export function sumLinkedCosts(linked) {
  return (linked || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
}

// Build a per-month roll-up across the last N months that combines
// manual cost records with linked marketing spend.
export function buildMonthlyCostSeries(months, costs = [], campaigns = [], socialCampaigns = []) {
  return months.map(m => {
    const record = costs.find(c => c.year === m.year && c.month === m.month)
    const { fixed, variable, adHoc } = sumManualCosts(record)
    const linked = computeLinkedCosts(m.month, m.year, campaigns, socialCampaigns)
    const linkedTotal = sumLinkedCosts(linked)
    return {
      monthLabel: m.label,
      monthKey: m.key,
      year: m.year,
      month: m.month,
      fixed,
      variable,
      adHoc,
      linked: linkedTotal,
      total: fixed + variable + adHoc + linkedTotal,
      record,
      linkedItems: linked,
    }
  })
}

// Aggregate acquisitions by source
export function aggregateBySource(acquisitions) {
  const bySource = {}

  acquisitions.forEach(acq => {
    const source = acq.source || 'other'
    if (!bySource[source]) {
      bySource[source] = 0
    }
    bySource[source] += acq.count || 0
  })

  const sourceLabels = {
    direct_meeting: 'Direct Meeting',
    email_campaign: 'Email Campaign',
    sms_campaign: 'SMS Campaign',
    social_media: 'Social Media',
    referral: 'Referral',
    other: 'Other',
  }

  return Object.entries(bySource).map(([source, value]) => ({
    name: sourceLabels[source] || source,
    value,
  }))
}
