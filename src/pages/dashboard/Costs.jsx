import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card, KPICard } from '../../components/ui/Card'
import { CardSkeleton, ChartSkeleton } from '../../components/ui/Skeleton'
import { ChartWrapper } from '../../components/charts/ChartWrapper'
import { CostBreakdownChart } from '../../components/charts/DonutChart'
import { Select } from '../../components/ui/Input'
import { DataTable } from '../../components/tables/DataTable'
import { Badge } from '../../components/ui/Badge'
import { useCollection, useDocument } from '../../hooks/useFirestore'
import { formatCurrency, formatPercentage, getMonthName } from '../../utils/formatters'
import {
  getLastNMonths,
  buildMonthlyCostSeries,
  calculateGrowthPercentage,
} from '../../utils/calculations'

const COST_COLORS = {
  fixed: '#0071E3',
  variable: '#34C759',
  adHoc: '#FF9500',
  linked: '#AF52DE',
}

export function CostAnalysis() {
  const { document: config, loading: configLoading } = useDocument('config', 'app')
  const { documents: costs, loading: costsLoading } = useCollection('costs')
  const { documents: campaigns, loading: campaignsLoading } = useCollection('campaigns')
  const { documents: socialCampaigns, loading: socialLoading } = useCollection('social_campaigns')
  const { documents: acquisitions, loading: acqLoading } = useCollection('acquisitions')
  const { documents: churnRecords, loading: churnLoading } = useCollection('churn')

  const [timeRange, setTimeRange] = useState('12')

  const loading =
    configLoading || costsLoading || campaignsLoading || socialLoading || acqLoading || churnLoading

  const months = useMemo(() => getLastNMonths(parseInt(timeRange)), [timeRange])

  // Cost series across the window
  const series = useMemo(
    () => buildMonthlyCostSeries(months, costs, campaigns, socialCampaigns),
    [months, costs, campaigns, socialCampaigns]
  )

  // Compute monthly MRR for the same window so we can show cost vs revenue
  const mrrByMonth = useMemo(() => {
    const packages = (config?.packages || []).filter(p => p.active)
    const cumulative = {}
    packages.forEach(p => (cumulative[p.name] = 0))
    return months.map(m => {
      const monthAcq = acquisitions.filter(a => a.date?.startsWith(m.key))
      const monthChurn = churnRecords.filter(c => c.date?.startsWith(m.key))
      packages.forEach(pkg => {
        const adds = monthAcq
          .filter(a => a.package === pkg.name || a.package === pkg.id)
          .reduce((s, a) => s + (a.count || 0), 0)
        const drops = monthChurn
          .filter(c => c.package === pkg.name || c.package === pkg.id)
          .reduce((s, c) => s + (c.count || 0), 0)
        cumulative[pkg.name] = Math.max(0, (cumulative[pkg.name] || 0) + adds - drops)
      })
      const mrr = packages.reduce(
        (sum, pkg) => sum + (cumulative[pkg.name] || 0) * (pkg.monthlyPrice || 0),
        0
      )
      return { key: m.key, mrr }
    })
  }, [months, acquisitions, churnRecords, config])

  // Combined chart data: cost components + revenue
  const chartData = useMemo(() => {
    return series.map((s, idx) => ({
      month: s.monthLabel,
      Fixed: s.fixed,
      Variable: s.variable,
      'Ad Hoc': s.adHoc,
      Marketing: s.linked,
      Total: s.total,
      Revenue: mrrByMonth[idx]?.mrr || 0,
      Margin:
        mrrByMonth[idx]?.mrr > 0
          ? ((mrrByMonth[idx].mrr - s.total) / mrrByMonth[idx].mrr) * 100
          : 0,
    }))
  }, [series, mrrByMonth])

  // KPIs
  const baseline = config?.targets?.expenditureBaseline || 0
  const current = series[series.length - 1] || { total: 0, fixed: 0, variable: 0, adHoc: 0, linked: 0 }
  const previous = series[series.length - 2] || { total: 0 }
  const ytd = series.reduce((sum, m) => sum + (m.total || 0), 0)
  const avgMonthly = series.length > 0 ? ytd / series.length : 0
  const costGrowth = calculateGrowthPercentage(current.total, previous.total)
  const currentRevenue = mrrByMonth[mrrByMonth.length - 1]?.mrr || 0
  const grossMargin = currentRevenue > 0 ? ((currentRevenue - current.total) / currentRevenue) * 100 : 0
  const baselineDelta = baseline > 0 ? current.total - baseline : 0

  // Donut breakdown for the latest month
  const breakdownData = [
    { name: 'Fixed', value: current.fixed },
    { name: 'Variable', value: current.variable },
    { name: 'Ad Hoc', value: current.adHoc },
    { name: 'Marketing (linked)', value: current.linked },
  ].filter(d => d.value > 0)

  // Latest-month linked-cost detail table
  const latestLinked = current.linkedItems || []

  const tableColumns = [
    {
      key: 'period',
      header: 'Month',
      render: (_, row) => `${getMonthName(row.month - 1)} ${row.year}`,
    },
    { key: 'fixed', header: 'Fixed', render: (val) => formatCurrency(val) },
    { key: 'variable', header: 'Variable', render: (val) => formatCurrency(val) },
    { key: 'adHoc', header: 'Ad Hoc', render: (val) => formatCurrency(val) },
    { key: 'linked', header: 'Marketing', render: (val) => formatCurrency(val) },
    {
      key: 'total',
      header: 'Total',
      render: (val) => <span className="font-semibold">{formatCurrency(val)}</span>,
    },
  ]
  const tableData = [...series].reverse()

  const CostTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white px-4 py-3 rounded-apple-sm shadow-apple-hover border border-apple-border-light">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.dataKey === 'Margin' ? formatPercentage(entry.value) : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <PageWrapper
      title="Cost Analysis"
      subtitle="Manual cost records combined with marketing spend from across the app"
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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              title="Current Month Costs"
              value={formatCurrency(current.total)}
              change={`${costGrowth >= 0 ? '+' : ''}${formatPercentage(costGrowth)}`}
              changeType={costGrowth <= 0 ? 'positive' : 'negative'}
              subtitle={`vs ${formatCurrency(previous.total)} prev month`}
            />
            <KPICard
              title="YTD Costs"
              value={formatCurrency(ytd)}
              subtitle={`Avg ${formatCurrency(avgMonthly)} / month`}
            />
            <KPICard
              title="Gross Margin"
              value={formatPercentage(grossMargin)}
              changeType={grossMargin >= 40 ? 'positive' : grossMargin >= 20 ? 'neutral' : 'negative'}
              subtitle={`Revenue ${formatCurrency(currentRevenue)}`}
            />
            <KPICard
              title="vs Baseline"
              value={baseline > 0 ? formatCurrency(baselineDelta) : '—'}
              changeType={
                baseline === 0 ? 'neutral' : baselineDelta <= 0 ? 'positive' : 'negative'
              }
              subtitle={baseline > 0 ? `Baseline ${formatCurrency(baseline)}` : 'Set baseline in Configuration'}
            />
          </>
        )}
      </div>

      {/* Trend chart: stacked cost components with revenue line */}
      <PageSection title="Cost Trend vs Revenue">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <div style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
                    tickFormatter={(value) =>
                      value >= 1000 ? `A$${(value / 1000).toFixed(0)}k` : `A$${value}`
                    }
                  />
                  <Tooltip content={<CostTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="Fixed" stackId="costs" fill={COST_COLORS.fixed} />
                  <Bar dataKey="Variable" stackId="costs" fill={COST_COLORS.variable} />
                  <Bar dataKey="Ad Hoc" stackId="costs" fill={COST_COLORS.adHoc} />
                  <Bar dataKey="Marketing" stackId="costs" fill={COST_COLORS.linked} radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#FF3B30"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  {baseline > 0 && (
                    <ReferenceLine
                      y={baseline}
                      stroke="#6E6E73"
                      strokeDasharray="5 5"
                      label={{ value: 'Baseline', fill: '#6E6E73', fontSize: 11 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </PageSection>

      {/* Breakdown donut + linked detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CostBreakdownChart
          data={breakdownData}
          loading={loading}
          title={`Breakdown — ${current.monthLabel || ''}`}
        />
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 tracking-heading">
              Marketing Costs (linked) — {current.monthLabel || ''}
            </h3>
            <span className="text-sm font-semibold text-apple-blue">
              {formatCurrency(current.linked || 0)}
            </span>
          </div>
          {latestLinked.length === 0 ? (
            <p className="text-sm text-apple-text-secondary">
              No marketing spend recorded for this month.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {latestLinked.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-apple-bg rounded-apple-sm p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="info" size="sm">{item.category}</Badge>
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly table */}
      <PageSection title="Monthly Detail">
        <Card padding={false}>
          <DataTable columns={tableColumns} data={tableData} loading={loading} />
        </Card>
      </PageSection>
    </PageWrapper>
  )
}
