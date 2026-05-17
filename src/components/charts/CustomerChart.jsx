import {
  LineChart,
  Line,
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

// Calculate appropriate tick interval based on max value
function getYAxisConfig(data, dataKey) {
  if (!data || data.length === 0) return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }

  const maxValue = Math.max(...data.map(d => d[dataKey] || 0))

  if (maxValue <= 0) {
    return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  } else if (maxValue <= 10) {
    return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  } else if (maxValue <= 50) {
    return { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
  } else if (maxValue <= 100) {
    return { domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100] }
  } else if (maxValue <= 500) {
    const ceiling = Math.ceil(maxValue / 100) * 100
    const step = ceiling / 5
    return {
      domain: [0, ceiling],
      ticks: Array.from({ length: 6 }, (_, i) => i * step)
    }
  } else {
    // For values over 500
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
    const ceiling = Math.ceil(maxValue / magnitude) * magnitude
    const step = ceiling / 5
    return {
      domain: [0, ceiling],
      ticks: Array.from({ length: 6 }, (_, i) => Math.round(i * step))
    }
  }
}

// For bar charts with two data series (acquisitions and churn)
function getBarChartYAxisConfig(data) {
  if (!data || data.length === 0) return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }

  const maxAcq = Math.max(...data.map(d => d.acquisitions || 0))
  const maxChurn = Math.max(...data.map(d => d.churn || 0))
  const maxValue = Math.max(maxAcq, maxChurn)

  if (maxValue <= 0) {
    return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  } else if (maxValue <= 10) {
    return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] }
  } else if (maxValue <= 50) {
    return { domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50] }
  } else if (maxValue <= 100) {
    return { domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100] }
  } else {
    const ceiling = Math.ceil(maxValue / 100) * 100
    const step = ceiling / 5
    return {
      domain: [0, ceiling],
      ticks: Array.from({ length: 6 }, (_, i) => i * step)
    }
  }
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

export function CustomerGrowthChart({ data, loading = false }) {
  const isEmpty = !data || data.length === 0
  const yAxisConfig = getYAxisConfig(data, 'total')

  return (
    <ChartWrapper title="Active Customers" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total Customers"
            stroke="#0071E3"
            strokeWidth={2}
            dot={{ fill: '#0071E3', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function AcquisitionChurnChart({ data, loading = false }) {
  const isEmpty = !data || data.length === 0
  const yAxisConfig = getBarChartYAxisConfig(data)

  return (
    <ChartWrapper title="Acquisitions vs Churn" loading={loading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
            iconSize={8}
          />
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
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
