export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-apple-bg text-apple-text-secondary',
    primary: 'bg-apple-active-bg text-apple-blue',
    success: 'bg-green-50 text-apple-green',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-apple-red',
    info: 'bg-blue-50 text-blue-600',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

// Sentiment/Interest level badges for meetings
export function SentimentBadge({ sentiment }) {
  const sentimentConfig = {
    very_positive: { label: 'Very Positive', variant: 'success' },
    positive: { label: 'Positive', variant: 'success' },
    neutral: { label: 'Neutral', variant: 'default' },
    negative: { label: 'Negative', variant: 'warning' },
    very_negative: { label: 'Very Negative', variant: 'danger' },
    very_interested: { label: 'Very Interested', variant: 'success' },
    interested: { label: 'Interested', variant: 'primary' },
    not_interested: { label: 'Not Interested', variant: 'warning' },
    rejected: { label: 'Rejected', variant: 'danger' },
  }

  const config = sentimentConfig[sentiment] || { label: sentiment, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

// Role badge
export function RoleBadge({ role }) {
  const roleConfig = {
    admin: { label: 'Admin', variant: 'danger' },
    manager: { label: 'Manager', variant: 'primary' },
    viewer: { label: 'Viewer', variant: 'default' },
  }

  const config = roleConfig[role] || { label: role, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

// Source badge for acquisitions
export function SourceBadge({ source }) {
  const sourceConfig = {
    direct_meeting: { label: 'Direct Meeting', variant: 'primary' },
    email_campaign: { label: 'Email', variant: 'info' },
    sms_campaign: { label: 'SMS', variant: 'info' },
    social_media: { label: 'Social Media', variant: 'success' },
    referral: { label: 'Referral', variant: 'warning' },
    other: { label: 'Other', variant: 'default' },
  }

  const config = sourceConfig[source] || { label: source, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

// Platform badge for social media
export function PlatformBadge({ platform }) {
  const platformConfig = {
    meta: { label: 'Meta', variant: 'primary' },
    linkedin: { label: 'LinkedIn', variant: 'info' },
    google: { label: 'Google', variant: 'warning' },
    tiktok: { label: 'TikTok', variant: 'danger' },
  }

  const config = platformConfig[platform] || { label: platform, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
