import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartWrapper } from './ChartWrapper'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-[12px] shadow-lg border border-[#E5E5EA]">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Y-axis sizing considers BOTH the actual series and any target values
// in the data, so target lines aren't clipped below the visible area.
function getYAxisConfig(data, keys) {
  if (!data || data.length === 0) {
    return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }
  }
  const maxValue = Math.max(
    0,
    ...data.flatMap(d => keys.map(k => Number(d[k]) || 0))
  )
  if (maxValue <= 0) return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }
  if (maxValue <= 500) return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }
  if (maxValue <= 1000) return { domain: [0, 1000], ticks: [0, 200, 400, 600, 800, 1000] }
  if (maxValue <= 5000) {
    const ceiling = Math.ceil(maxValue / 1000) * 1000
    const step = ceiling / 5
    return { domain: [0, ceiling], ticks: Array.from({ length: 6 }, (_, i) => i * step) }
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const ceiling = Math.ceil(maxValue / magnitude) * magnitude
  const step = ceiling / 5
  return { domain: [0, ceiling], ticks: Array.from({ length: 6 }, (_, i) => Math.round(i * step)) }
}

// Accepts either `targetMRR` (legacy single value) or, preferred, per-month
// target values embedded in each row as `mrrTarget`. When per-month values
// are present, we draw a stepped dashed line; the chart auto-extends its
// Y-axis to include those values.
export function RevenueChart({ data, loading = false, targetMRR }) {
  const isEmpty = !data || data.length === 0

  // If `mrrTarget` isn't already in the data, fill it from the legacy scalar
  // so the chart shape stays consistent.
  const enrichedData = (data || []).map(row => ({
    ...row,
    mrrTarget:
      row.mrrTarget !== undefined && row.mrrTarget !== null
        ? row.mrrTarget
        : (Number(targetMRR) || 0),
  }))

  const hasAnyTarget = enrichedData.some(d => (Number(d.mrrTarget) || 0) > 0)
  const yAxisConfig = getYAxisConfig(enrichedData, hasAnyTarget ? ['mrr', 'mrrTarget'] : ['mrr'])

  const formatYAxis = (value) => (value >= 1000 ? `A$${(value / 1000).toFixed(0)}k` : `A$${value}`)

  return (
    <ChartWrapper title="Monthly Recurring Revenue" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={enrichedData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0071E3" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0071E3" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          {hasAnyTarget && (
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          )}
          <Area
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke="#0071E3"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          {hasAnyTarget && (
            <Line
              type="linear"
              dataKey="mrrTarget"
              name="MRR Target"
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
