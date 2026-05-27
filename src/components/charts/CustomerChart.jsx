import {
  LineChart,
  Line,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartWrapper } from './ChartWrapper'

// Y-axis bounds derived from the union of every numeric field we plot.
// This ensures the dashed target line is never clipped below the visible
// range, even when the target exceeds the actual data.
function getYAxisConfigForKeys(data, keys) {
  if (!data || data.length === 0) return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  const maxValue = Math.max(
    0,
    ...data.flatMap(d => keys.map(k => Number(d[k]) || 0))
  )
  if (maxValue <= 0) return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  if (maxValue <= 10) return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  if (maxValue <= 50) return { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
  if (maxValue <= 100) return { domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100] }
  if (maxValue <= 500) {
    const ceiling = Math.ceil(maxValue / 100) * 100
    const step = ceiling / 5
    return { domain: [0, ceiling], ticks: Array.from({ length: 6 }, (_, i) => i * step) }
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const ceiling = Math.ceil(maxValue / magnitude) * magnitude
  const step = ceiling / 5
  return { domain: [0, ceiling], ticks: Array.from({ length: 6 }, (_, i) => Math.round(i * step)) }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-apple-sm shadow-apple-hover border border-apple-border-light">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Active customers chart. If the data rows include a `customerTarget` field
// (the cumulative monthly new-customer target trajectory), it's drawn as a
// dashed stepped line alongside the actual count.
export function CustomerGrowthChart({ data, loading = false }) {
  const isEmpty = !data || data.length === 0
  const hasTarget = (data || []).some(d => (Number(d.customerTarget) || 0) > 0)
  const yAxisConfig = getYAxisConfigForKeys(data, hasTarget ? ['total', 'customerTarget'] : ['total'])

  return (
    <ChartWrapper title="Active Customers" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6E6E73' }}
            axisLine={{ stroke: '#E5E5EA' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6E6E73' }}
            axisLine={false}
            tickLine={false}
            domain={yAxisConfig.domain}
            ticks={yAxisConfig.ticks}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Customers"
            stroke="#0071E3"
            strokeWidth={2}
            dot={{ fill: '#0071E3', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
          {hasTarget && (
            <Line
              type="linear"
              dataKey="customerTarget"
              name="Customer Target (cumulative)"
              stroke="#34C759"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

// Acquisitions vs Churn. If `acquisitionTarget` is present per row (the
// applicable monthly new-customer target for that month), draws a stepped
// dashed line so the target can vary month to month.
export function AcquisitionChurnChart({ data, loading = false, acquisitionTarget }) {
  const isEmpty = !data || data.length === 0

  // Backwards compatibility: if the caller passed a single scalar target
  // and the rows don't already have per-month targets, broadcast it.
  const enrichedData = (data || []).map(row => ({
    ...row,
    acquisitionTarget:
      row.acquisitionTarget !== undefined && row.acquisitionTarget !== null
        ? row.acquisitionTarget
        : (Number(acquisitionTarget) || 0),
  }))

  const hasTarget = enrichedData.some(d => (Number(d.acquisitionTarget) || 0) > 0)
  const yAxisConfig = getYAxisConfigForKeys(
    enrichedData,
    hasTarget ? ['acquisitions', 'churn', 'acquisitionTarget'] : ['acquisitions', 'churn']
  )

  return (
    <ChartWrapper title="Acquisitions vs Churn" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6E6E73' }}
            axisLine={{ stroke: '#E5E5EA' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6E6E73' }}
            axisLine={false}
            tickLine={false}
            domain={yAxisConfig.domain}
            ticks={yAxisConfig.ticks}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar
            dataKey="acquisitions"
            name="Acquisitions"
            fill="#34C759"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="churn"
            name="Churn"
            fill="#FF3B30"
            radius={[4, 4, 0, 0]}
          />
          {hasTarget && (
            <Line
              type="linear"
              dataKey="acquisitionTarget"
              name="Acquisition Target"
              stroke="#0071E3"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
