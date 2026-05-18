import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { KPICard, Card } from '../../components/ui/Card'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { RevenueChart } from '../../components/charts/RevenueChart'
import { CustomerGrowthChart, AcquisitionChurnChart } from '../../components/charts/CustomerChart'
import { SourceDonutChart } from '../../components/charts/DonutChart'
import { useCollection, useDocument } from '../../hooks/useFirestore'
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters'
import {
  calculateGrowthPercentage,
  getLastNMonths,
  aggregateBySource,
  buildMonthlyCostSeries,
} from '../../utils/calculations'

export function Overview() {
  const { document: config, loading: configLoading } = useDocument('config', 'app')
  const { documents: acquisitions, loading: acqLoading } = useCollection('acquisitions')
  const { documents: churnRecords, loading: churnLoading } = useCollection('churn')
  const { documents: costs, loading: costsLoading } = useCollection('costs')
  const { documents: campaigns, loading: campaignsLoading } = useCollection('campaigns')
  const { documents: socialCampaigns, loading: socialLoading } = useCollection('social_campaigns')

  const loading =
    configLoading || acqLoading || churnLoading || costsLoading || campaignsLoading || socialLoading

  // Calculate KPIs
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    mrr: 0,
    mrrGrowth: 0,
    ytdRevenue: 0,
    churnRate: 0,
    newCustomersThisMonth: 0,
    monthlyCosts: 0,
    ytdCosts: 0,
    grossMargin: 0,
  })

  const [chartData, setChartData] = useState({
    revenue: [],
    customers: [],
    acquisitionsChurn: [],
    sources: [],
  })

  useEffect(() => {
    if (loading) return

    const packages = config?.packages || []
    const activePackages = packages.filter(p => p.active)
    const months = getLastNMonths(12)

    // Track cumulative customers per package across months
    // Initialize with 0 customers for each package
    const cumulativeCustomersByPackage = {}
    activePackages.forEach(pkg => {
      cumulativeCustomersByPackage[pkg.name] = 0
    })

    // Build monthly data with proper cumulative MRR calculation
    const monthlyData = months.map(month => {
      const monthAcquisitions = acquisitions.filter(a => {
        if (!a.date) return false
        return a.date.startsWith(month.key)
      })
      const monthChurn = churnRecords.filter(c => {
        if (!c.date) return false
        return c.date.startsWith(month.key)
      })

      // Track acquisitions and churn per package
      activePackages.forEach(pkg => {
        // Count acquisitions for this package this month
        const pkgAcquisitions = monthAcquisitions
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
      })

      // Calculate total customers across all packages
      const totalCustomers = Object.values(cumulativeCustomersByPackage).reduce((sum, count) => sum + count, 0)

      // Calculate MRR based on cumulative customers per package
      const mrr = activePackages.reduce((total, pkg) => {
        const pkgCustomers = cumulativeCustomersByPackage[pkg.name] || 0
        return total + (pkgCustomers * (pkg.monthlyPrice || 0))
      }, 0)

      const acqCount = monthAcquisitions.reduce((sum, a) => sum + (a.count || 0), 0)
      const churnCount = monthChurn.reduce((sum, c) => sum + (c.count || 0), 0)

      return {
        month: month.label,
        customers: totalCustomers,
        mrr,
        acquisitions: acqCount,
        churn: churnCount,
      }
    })

    // Current month data
    const currentMonth = monthlyData[monthlyData.length - 1] || {}
    const previousMonth = monthlyData[monthlyData.length - 2] || {}

    // Calculate YTD revenue
    const ytdRevenue = monthlyData.reduce((sum, m) => sum + (m.mrr || 0), 0)

    // Calculate churn rate
    const churnRate = previousMonth.customers > 0
      ? ((currentMonth.churn || 0) / previousMonth.customers) * 100
      : 0

    // MRR growth
    const mrrGrowth = calculateGrowthPercentage(currentMonth.mrr, previousMonth.mrr)

    // Cost roll-up across the same window
    const costSeries = buildMonthlyCostSeries(months, costs, campaigns, socialCampaigns)
    const currentMonthCosts = costSeries[costSeries.length - 1]?.total || 0
    const ytdCosts = costSeries.reduce((sum, m) => sum + (m.total || 0), 0)
    const grossMargin = currentMonth.mrr > 0
      ? ((currentMonth.mrr - currentMonthCosts) / currentMonth.mrr) * 100
      : 0

    setKpis({
      totalCustomers: currentMonth.customers || 0,
      mrr: currentMonth.mrr || 0,
      mrrGrowth,
      ytdRevenue,
      churnRate,
      newCustomersThisMonth: currentMonth.acquisitions || 0,
      monthlyCosts: currentMonthCosts,
      ytdCosts,
      grossMargin,
    })

    setChartData({
      revenue: monthlyData.map(m => ({ month: m.month, mrr: m.mrr })),
      customers: monthlyData.map(m => ({ month: m.month, total: m.customers })),
      acquisitionsChurn: monthlyData.map(m => ({
        month: m.month,
        acquisitions: m.acquisitions,
        churn: m.churn,
      })),
      sources: aggregateBySource(acquisitions),
    })
  }, [loading, config, acquisitions, churnRecords, costs, campaigns, socialCampaigns])

  return (
    <PageWrapper
      title="Dashboard Overview"
      subtitle="Key metrics and performance indicators"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              title="Active Customers"
              value={formatNumber(kpis.totalCustomers)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <KPICard
              title="MRR"
              value={formatCurrency(kpis.mrr)}
              change={`${kpis.mrrGrowth >= 0 ? '+' : ''}${formatPercentage(kpis.mrrGrowth)}`}
              changeType={kpis.mrrGrowth >= 0 ? 'positive' : 'negative'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KPICard
              title="MRR Growth"
              value={`${kpis.mrrGrowth >= 0 ? '+' : ''}${formatPercentage(kpis.mrrGrowth)}`}
              changeType={kpis.mrrGrowth >= 0 ? 'positive' : 'negative'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <KPICard
              title="YTD Revenue"
              value={formatCurrency(kpis.ytdRevenue)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <KPICard
              title="Churn Rate"
              value={formatPercentage(kpis.churnRate)}
              changeType={kpis.churnRate > 5 ? 'negative' : kpis.churnRate > 2 ? 'neutral' : 'positive'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              }
            />
            <KPICard
              title="New This Month"
              value={formatNumber(kpis.newCustomersThisMonth)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
            <KPICard
              title="Monthly Costs"
              value={formatCurrency(kpis.monthlyCosts)}
              subtitle="Manual + linked marketing"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m4 0h4M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <KPICard
              title="YTD Costs"
              value={formatCurrency(kpis.ytdCosts)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m-6 4h6m-6 4h4m5 5H5a2 2 0 01-2-2V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <KPICard
              title="Gross Margin"
              value={formatPercentage(kpis.grossMargin)}
              changeType={kpis.grossMargin >= 40 ? 'positive' : kpis.grossMargin >= 20 ? 'neutral' : 'negative'}
              subtitle="(MRR − Costs) ÷ MRR"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M7 14l4-4 4 4 5-5" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart
          data={chartData.revenue}
          loading={loading}
          targetMRR={config?.targets?.mrrTarget}
        />
        <CustomerGrowthChart data={chartData.customers} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcquisitionChurnChart data={chartData.acquisitionsChurn} loading={loading} />
        <SourceDonutChart data={chartData.sources} loading={loading} />
      </div>
    </PageWrapper>
  )
}
