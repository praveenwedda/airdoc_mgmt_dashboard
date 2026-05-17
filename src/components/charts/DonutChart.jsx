import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartWrapper } from './ChartWrapper'
import { formatCurrency } from '../../utils/formatters'

const COLORS = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6']

const CustomTooltip = ({ active, payload, isCurrency = false }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white px-4 py-3 rounded-apple-sm shadow-apple-hover border border-apple-border-light">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-apple-text-secondary">
          {isCurrency ? formatCurrency(data.value) : data.value} ({data.payload.percentage}%)
        </p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-apple-text-secondary">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function SourceDonutChart({ data, loading = false, title = 'Acquisition by Source' }) {
  const isEmpty = !data || data.length === 0

  // Calculate percentages
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0
  const dataWithPercentage = data?.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
  })) || []

  return (
    <ChartWrapper title={title} loading={loading} isEmpty={isEmpty} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function CostBreakdownChart({ data, loading = false, title = 'Cost Breakdown' }) {
  const isEmpty = !data || data.length === 0

  // Calculate percentages
  const total = data?.reduce((sum, item) => sum + item.value, 0) || 0
  const dataWithPercentage = data?.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
  })) || []

  return (
    <ChartWrapper title={title} loading={loading} isEmpty={isEmpty} height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip isCurrency />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
