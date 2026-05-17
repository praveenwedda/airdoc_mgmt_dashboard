import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

// Calculate appropriate tick interval based on max value
function getYAxisConfig(data, dataKey) {
  if (!data || data.length === 0) return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }

  const maxValue = Math.max(...data.map(d => d[dataKey] || 0))

  if (maxValue <= 0) {
    return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }
  } else if (maxValue <= 500) {
    return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }
  } else if (maxValue <= 1000) {
    return { domain: [0, 1000], ticks: [0, 200, 400, 600, 800, 1000] }
  } else if (maxValue <= 5000) {
    const ceiling = Math.ceil(maxValue / 1000) * 1000
    const step = ceiling / 5
    return {
      domain: [0, ceiling],
      ticks: Array.from({ length: 6 }, (_, i) => i * step)
    }
  } else {
    // For values over 5000, use larger increments
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
    const ceiling = Math.ceil(maxValue / magnitude) * magnitude
    const step = ceiling / 5
    return {
      domain: [0, ceiling],
      ticks: Array.from({ length: 6 }, (_, i) => Math.round(i * step))
    }
  }
}

export function RevenueChart({ data, loading = false, targetMRR }) {
  const isEmpty = !data || data.length === 0
  const yAxisConfig = getYAxisConfig(data, 'mrr')

  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `A$${(value / 1000).toFixed(0)}k`
    }
    return `A$${value}`
  }

  return (
    <ChartWrapper title="Monthly Recurring Revenue" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
          {targetMRR && (
            <ReferenceLine
              y={targetMRR}
              stroke="#34C759"
              strokeDasharray="5 5"
              label={{ value: 'Target', fill: '#34C759', fontSize: 11 }}
            />
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
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
