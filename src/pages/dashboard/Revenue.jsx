import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card, KPICard } from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { RevenueChart } from '../../components/charts/RevenueChart'
import { useCollection, useDocument } from '../../hooks/useFirestore'
import { formatCurrency, formatPercentage } from '../../utils/formatters'
import { getLastNMonths, calculateGrowthPercentage } from '../../utils/calculations'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = ['#0071E3', '#34C759', '#FF9500', '#AF52DE', '#5856D6']

// Calculate appropriate tick interval based on max value
function getYAxisConfig(data, packages) {
  if (!data || data.length === 0) return { domain: [0, 500], ticks: [0, 100, 200, 300, 400, 500] }

  // Find max total MRR across all months
  const maxValue = Math.max(...data.map(d => d.mrr || 0))

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

export function Revenue() {
  const { document: config, loading: configLoading } = useDocument('config', 'app')
  const { documents: acquisitions, loading: acqLoading } = useCollection('acquisitions')
  const { documents: churnRecords, loading: churnLoading } = useCollection('churn')

  const [timeRange, setTimeRange] = useState('12')
  const [revenueData, setRevenueData] = useState([])
  const [packageBreakdown, setPackageBreakdown] = useState([])
  const [kpis, setKpis] = useState({ mrr: 0, growth: 0, arpu: 0, ltv: 0 })

  const loading = configLoading || acqLoading || churnLoading

  useEffect(() => {
    if (loading) return

    const packages = config?.packages?.filter(p => p.active) || []
    const months = getLastNMonths(parseInt(timeRange))

    // Track cumulative customers per package across months
    const cumulativeCustomersByPackage = {}
    packages.forEach(pkg => {
      cumulativeCustomersByPackage[pkg.name] = 0
    })

    const monthlyData = months.map(month => {
      const monthAcq = acquisitions.filter(a => a.date?.startsWith(month.key))
      const monthChurn = churnRecords.filter(c => c.date?.startsWith(month.key))

      // Calculate revenue by package with cumulative tracking
      const packageRevenue = {}
      let totalMRR = 0

      packages.forEach(pkg => {
        // Count acquisitions for this package this month
        const pkgAcquisitions = monthAcq
          .filter(a => a.package === pkg.name || a.package === pkg.id)
          .reduce((sum, a) => sum + (a.count || 0), 0)

        // Count churn for this package this month
        const pkgChurn = monthChurn
          .filter(c => c.package === pkg.name || c.package === pkg.id)
          .reduce((sum, c) => sum + (c.count || 0), 0)

        // Update cumulative customers for this package
        cumulativeCustomersByPackage[pkg.name] += pkgAcquisitions - pkgChurn
        // Ensure we don't go negative
        if (cumulativeCustomersByPackage[pkg.name] < 0) {
          cumulativeCustomersByPackage[pkg.name] = 0
        }

        // Revenue = cumulative customers * monthly price
        const revenue = cumulativeCustomersByPackage[pkg.name] * (pkg.monthlyPrice || 0)
        packageRevenue[pkg.name] = revenue
        totalMRR += revenue
      })

      // Calculate total customers across all packages
      const totalCustomers = Object.values(cumulativeCustomersByPackage).reduce((sum, count) => sum + count, 0)

      return {
        month: month.label,
        mrr: totalMRR,
        customers: totalCustomers,
        ...packageRevenue,
      }
    })

    setRevenueData(monthlyData)

    // Package breakdown for current period - use the final cumulative counts
    const breakdown = packages.map(pkg => ({
      name: pkg.name,
      revenue: cumulativeCustomersByPackage[pkg.name] * (pkg.monthlyPrice || 0),
      price: pkg.monthlyPrice,
      customers: cumulativeCustomersByPackage[pkg.name] || 0,
    }))
    setPackageBreakdown(breakdown)

    // Calculate KPIs
    const currentMonth = monthlyData[monthlyData.length - 1] || { mrr: 0, customers: 0 }
    const previousMonth = monthlyData[monthlyData.length - 2] || { mrr: 0, customers: 0 }
    const growth = calculateGrowthPercentage(currentMonth.mrr, previousMonth.mrr)
    const arpu = currentMonth.customers > 0 ? currentMonth.mrr / currentMonth.customers : 0
    const avgChurnRate = 0.05 // 5% assumed
    const ltv = avgChurnRate > 0 ? arpu / avgChurnRate : arpu * 24

    setKpis({
      mrr: currentMonth.mrr || 0,
      growth,
      arpu,
      ltv,
    })
  }, [loading, config, acquisitions, churnRecords, timeRange])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-apple-sm shadow-apple-hover border border-apple-border-light">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
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

  return (
    <PageWrapper
      title="Revenue Analytics"
      subtitle="Track your recurring revenue and growth"
      actions={
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          options={[
            { value: '3', label: 'Last 3 months' },
            { value: '6', label: 'Last 6 months' },
            { value: '12', label: 'Last 12 months' },
          ]}
          className="w-40"
        />
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Current MRR"
          value={formatCurrency(kpis.mrr)}
          change={`${kpis.growth >= 0 ? '+' : ''}${formatPercentage(kpis.growth)}`}
          changeType={kpis.growth >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="MRR Growth"
          value={`${kpis.growth >= 0 ? '+' : ''}${formatPercentage(kpis.growth)}`}
          changeType={kpis.growth >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="ARPU"
          value={formatCurrency(kpis.arpu)}
          subtitle="Average Revenue Per User"
        />
        <KPICard
          title="Est. LTV"
          value={formatCurrency(kpis.ltv)}
          subtitle="Lifetime Value"
        />
      </div>

      {/* MRR Chart */}
      <PageSection title="MRR Trend">
        <RevenueChart
          data={revenueData}
          loading={loading}
          targetMRR={config?.targets?.mrrTarget}
        />
      </PageSection>

      {/* Revenue by Package */}
      <PageSection title="Revenue by Package">
        <Card>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
                  domain={getYAxisConfig(revenueData).domain}
                  ticks={getYAxisConfig(revenueData).ticks}
                  tickFormatter={(value) => value >= 1000 ? `A$${(value / 1000).toFixed(0)}k` : `A$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                {(config?.packages || []).filter(p => p.active).map((pkg, idx) => (
                  <Bar
                    key={pkg.name}
                    dataKey={pkg.name}
                    name={pkg.name}
                    stackId="a"
                    fill={COLORS[idx % COLORS.length]}
                    radius={idx === (config?.packages?.filter(p => p.active).length - 1) ? [4, 4, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </PageSection>

      {/* Package Breakdown Table */}
      <PageSection title="Current Month Breakdown">
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="bg-apple-bg border-b border-apple-border-light">
                <th className="px-6 py-3 text-left text-xs font-semibold text-apple-text-secondary uppercase">Package</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-apple-text-secondary uppercase">Price/Month</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-apple-text-secondary uppercase">Active Customers</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-apple-text-secondary uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border-light">
              {packageBreakdown.map((pkg, idx) => (
                <tr key={pkg.name}>
                  <td className="px-6 py-4 text-sm text-gray-900">{pkg.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(pkg.price)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{pkg.customers}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(pkg.revenue)}</td>
                </tr>
              ))}
              <tr className="bg-apple-bg">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total MRR</td>
                <td></td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                  {packageBreakdown.reduce((sum, p) => sum + p.customers, 0)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-apple-blue text-right">
                  {formatCurrency(packageBreakdown.reduce((sum, p) => sum + p.revenue, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </PageSection>
    </PageWrapper>
  )
}
