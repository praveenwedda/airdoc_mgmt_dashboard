import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card, KPICard } from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { CustomerGrowthChart, AcquisitionChurnChart } from '../../components/charts/CustomerChart'
import { SourceDonutChart } from '../../components/charts/DonutChart'
import { DataTable } from '../../components/tables/DataTable'
import { SentimentBadge } from '../../components/ui/Badge'
import { useCollection, useDocument } from '../../hooks/useFirestore'
import { formatNumber, formatPercentage, formatDate } from '../../utils/formatters'
import { getLastNMonths, aggregateBySource, calculateGrowthPercentage } from '../../utils/calculations'

export function Customers() {
  const { document: config, loading: configLoading } = useDocument('config', 'app')
  const { documents: acquisitions, loading: acqLoading } = useCollection('acquisitions')
  const { documents: churnRecords, loading: churnLoading } = useCollection('churn')
  const { documents: meetings, loading: meetingsLoading } = useCollection('meetings')

  const [timeRange, setTimeRange] = useState('6')
  const [chartData, setChartData] = useState({ customers: [], acqChurn: [], sources: [] })
  const [kpis, setKpis] = useState({ total: 0, growth: 0, churnRate: 0, netNew: 0 })

  const loading = configLoading || acqLoading || churnLoading || meetingsLoading

  // Get prospect meetings (leads)
  const leads = meetings.filter(m => m.type === 'prospect')

  useEffect(() => {
    if (loading) return

    const months = getLastNMonths(parseInt(timeRange))
    let previousCustomers = 0

    const monthlyData = months.map(month => {
      const monthAcq = acquisitions.filter(a => a.date?.startsWith(month.key))
      const monthChurn = churnRecords.filter(c => c.date?.startsWith(month.key))

      const acqCount = monthAcq.reduce((sum, a) => sum + (a.count || 0), 0)
      const churnCount = monthChurn.reduce((sum, c) => sum + (c.count || 0), 0)
      const customers = previousCustomers + acqCount - churnCount
      previousCustomers = Math.max(0, customers)

      return {
        month: month.label,
        total: previousCustomers,
        acquisitions: acqCount,
        churn: churnCount,
      }
    })

    setChartData({
      customers: monthlyData,
      acqChurn: monthlyData,
      sources: aggregateBySource(acquisitions),
    })

    // KPIs
    const current = monthlyData[monthlyData.length - 1] || {}
    const previous = monthlyData[monthlyData.length - 2] || {}
    const growth = calculateGrowthPercentage(current.total, previous.total)
    const churnRate = previous.total > 0 ? (current.churn / previous.total) * 100 : 0

    setKpis({
      total: current.total || 0,
      growth,
      churnRate,
      netNew: (current.acquisitions || 0) - (current.churn || 0),
    })
  }, [loading, acquisitions, churnRecords, timeRange])

  const leadsColumns = [
    { key: 'company', header: 'Company' },
    { key: 'contactPerson', header: 'Contact' },
    { key: 'date', header: 'Meeting Date', render: (val) => formatDate(val) },
    { key: 'interestLevel', header: 'Interest', render: (val) => <SentimentBadge sentiment={val} /> },
    { key: 'followUpDate', header: 'Follow-up', render: (val) => formatDate(val) },
  ]

  return (
    <PageWrapper
      title="Customer Analytics"
      subtitle="Track customer growth and acquisition"
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
          title="Total Customers"
          value={formatNumber(kpis.total)}
          change={`${kpis.growth >= 0 ? '+' : ''}${formatPercentage(kpis.growth)}`}
          changeType={kpis.growth >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="Customer Growth"
          value={`${kpis.growth >= 0 ? '+' : ''}${formatPercentage(kpis.growth)}`}
          changeType={kpis.growth >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="Churn Rate"
          value={formatPercentage(kpis.churnRate)}
          changeType={kpis.churnRate > 5 ? 'negative' : 'positive'}
        />
        <KPICard
          title="Net New (This Month)"
          value={kpis.netNew >= 0 ? `+${kpis.netNew}` : kpis.netNew}
          changeType={kpis.netNew >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CustomerGrowthChart data={chartData.customers} loading={loading} />
        <AcquisitionChurnChart data={chartData.acqChurn} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SourceDonutChart data={chartData.sources} loading={loading} />

        {/* Acquisition Target Progress */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Target Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-apple-text-secondary">New Customers Target</span>
                <span className="font-medium">
                  {chartData.acqChurn[chartData.acqChurn.length - 1]?.acquisitions || 0} / {config?.targets?.newCustomerTarget || 10}
                </span>
              </div>
              <div className="h-3 bg-apple-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-apple-blue rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((chartData.acqChurn[chartData.acqChurn.length - 1]?.acquisitions || 0) / (config?.targets?.newCustomerTarget || 10)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lead Pipeline */}
      <PageSection title="Lead Pipeline">
        <DataTable
          columns={leadsColumns}
          data={leads.slice(0, 10)}
          loading={meetingsLoading}
          emptyMessage="No leads in pipeline"
        />
      </PageSection>
    </PageWrapper>
  )
}
