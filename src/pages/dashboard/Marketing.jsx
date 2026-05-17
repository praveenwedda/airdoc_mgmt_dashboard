import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card, KPICard } from '../../components/ui/Card'
import { useCollection } from '../../hooks/useFirestore'
import { formatNumber, formatPercentage, formatCurrency } from '../../utils/formatters'
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

export function MarketingSummary() {
  const { documents: meetings, loading: meetingsLoading } = useCollection('meetings')
  const { documents: campaigns, loading: campaignsLoading } = useCollection('campaigns')
  const { documents: socialCampaigns, loading: socialLoading } = useCollection('social_campaigns')

  const loading = meetingsLoading || campaignsLoading || socialLoading

  const [kpis, setKpis] = useState({
    totalMeetings: 0,
    totalLeads: 0,
    emailResponseRate: 0,
    smsResponseRate: 0,
    socialImpressions: 0,
    socialReach: 0,
    socialMessages: 0,
    totalAdSpend: 0,
  })

  const [platformData, setPlatformData] = useState([])

  useEffect(() => {
    if (loading) return

    // Meeting stats
    const existingMeetings = meetings.filter(m => m.type === 'existing').length
    const prospectMeetings = meetings.filter(m => m.type === 'prospect').length
    const totalMeetings = meetings.length

    // Campaign stats
    const emailCampaigns = campaigns.filter(c => c.type === 'email')
    const smsCampaigns = campaigns.filter(c => c.type === 'sms')

    const emailTotalDelivered = emailCampaigns.reduce((sum, c) => sum + (c.delivered || 0), 0)
    const emailTotalResponses = emailCampaigns.reduce((sum, c) => sum + (c.responses || 0), 0)
    const emailResponseRate = emailTotalDelivered > 0 ? (emailTotalResponses / emailTotalDelivered) * 100 : 0

    const smsTotalDelivered = smsCampaigns.reduce((sum, c) => sum + (c.delivered || 0), 0)
    const smsTotalResponses = smsCampaigns.reduce((sum, c) => sum + (c.responses || 0), 0)
    const smsResponseRate = smsTotalDelivered > 0 ? (smsTotalResponses / smsTotalDelivered) * 100 : 0

    // Social media stats
    const socialImpressions = socialCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
    const socialReach = socialCampaigns.reduce((sum, c) => sum + (c.reach || 0), 0)
    const socialMessages = socialCampaigns.reduce((sum, c) => sum + (c.messages || 0), 0)
    const totalAdSpend = socialCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)

    setKpis({
      totalMeetings,
      totalLeads: prospectMeetings,
      emailResponseRate,
      smsResponseRate,
      socialImpressions,
      socialReach,
      socialMessages,
      totalAdSpend,
    })

    // Platform breakdown
    const platformStats = {}
    socialCampaigns.forEach(c => {
      const platform = c.platform || 'other'
      if (!platformStats[platform]) {
        platformStats[platform] = { impressions: 0, reach: 0, spend: 0, messages: 0 }
      }
      platformStats[platform].impressions += c.impressions || 0
      platformStats[platform].reach += c.reach || 0
      platformStats[platform].spend += c.spend || 0
      platformStats[platform].messages += c.messages || 0
    })

    const platformLabels = {
      meta: 'Meta',
      linkedin: 'LinkedIn',
      google: 'Google',
      tiktok: 'TikTok',
    }

    setPlatformData(
      Object.entries(platformStats).map(([key, data]) => ({
        name: platformLabels[key] || key,
        ...data,
      }))
    )
  }, [loading, meetings, campaigns, socialCampaigns])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-apple-sm shadow-apple-hover border border-apple-border-light">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'spend' ? formatCurrency(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <PageWrapper
      title="Marketing Summary"
      subtitle="Overview of all marketing activities"
    >
      {/* KPIs Row 1 - Meetings & Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Meetings"
          value={formatNumber(kpis.totalMeetings)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KPICard
          title="Leads in Pipeline"
          value={formatNumber(kpis.totalLeads)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KPICard
          title="Email Response Rate"
          value={formatPercentage(kpis.emailResponseRate)}
          changeType={kpis.emailResponseRate > 5 ? 'positive' : 'neutral'}
        />
        <KPICard
          title="SMS Response Rate"
          value={formatPercentage(kpis.smsResponseRate)}
          changeType={kpis.smsResponseRate > 5 ? 'positive' : 'neutral'}
        />
      </div>

      {/* KPIs Row 2 - Social Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Social Impressions"
          value={formatNumber(kpis.socialImpressions)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <KPICard
          title="Social Reach"
          value={formatNumber(kpis.socialReach)}
        />
        <KPICard
          title="Messages/Leads"
          value={formatNumber(kpis.socialMessages)}
        />
        <KPICard
          title="Total Ad Spend"
          value={formatCurrency(kpis.totalAdSpend)}
        />
      </div>

      {/* Platform Performance */}
      {platformData.length > 0 && (
        <PageSection title="Performance by Platform">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Impressions & Reach</h4>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={{ stroke: '#E5E5EA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                    <Bar dataKey="impressions" name="Impressions" fill="#0071E3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reach" name="Reach" fill="#34C759" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Spend vs Messages</h4>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={{ stroke: '#E5E5EA' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                    <Bar dataKey="spend" name="Ad Spend (A$)" fill="#FF9500" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="messages" name="Messages" fill="#AF52DE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </PageSection>
      )}
    </PageWrapper>
  )
}
