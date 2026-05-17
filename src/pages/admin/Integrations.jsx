import { PageWrapper, PageSection } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta (Facebook/Instagram)',
    description: 'Connect your Meta Business account to automatically sync ad performance data.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
      </svg>
    ),
    color: '#1877F2',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn Marketing account to sync campaign analytics.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    ),
    color: '#0A66C2',
    docsUrl: 'https://docs.microsoft.com/en-us/linkedin/marketing/',
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Connect your Google Ads account to automatically import campaign data.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
      </svg>
    ),
    color: '#4285F4',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/start',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect your TikTok for Business account to track advertising performance.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
      </svg>
    ),
    color: '#000000',
    docsUrl: 'https://ads.tiktok.com/marketing_api/docs',
  },
]

export function Integrations() {
  const { canConnectSocialAPIs } = usePermissions()
  const apiEnabled = import.meta.env.VITE_SOCIAL_API_ENABLED === 'true'

  if (!canConnectSocialAPIs) {
    return (
      <PageWrapper title="Integrations">
        <div className="text-center py-12">
          <p className="text-apple-text-secondary">You do not have permission to access this page.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Social Media Connections"
      subtitle="Connect your advertising accounts for automated data sync"
    >
      {!apiEnabled && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">API Integration Disabled</h3>
              <p className="text-sm text-amber-700 mt-1">
                Social media API integration is currently disabled. To enable it:
              </p>
              <ol className="text-sm text-amber-700 mt-2 list-decimal list-inside space-y-1">
                <li>Set <code className="bg-amber-100 px-1 rounded">VITE_SOCIAL_API_ENABLED=true</code> in your .env file</li>
                <li>Add your API credentials for each platform</li>
                <li>Restart the application</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => (
          <Card key={platform.id} className="relative">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
              >
                {platform.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">{platform.name}</h3>
                  <Badge variant="default">Not Connected</Badge>
                </div>
                <p className="text-sm text-apple-text-secondary mb-4">
                  {platform.description}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!apiEnabled}
                    onClick={() => {
                      // OAuth flow would be triggered here
                      alert(`OAuth flow for ${platform.name} would be triggered here. This requires server-side implementation.`)
                    }}
                  >
                    Connect
                  </Button>
                  <a
                    href={platform.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-apple-blue hover:underline"
                  >
                    View Docs
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PageSection title="Setup Instructions" className="mt-8">
        <Card>
          <div className="prose prose-sm max-w-none">
            <p className="text-apple-text-secondary">
              To set up social media API integrations, you'll need to:
            </p>
            <ol className="text-apple-text-secondary space-y-2 mt-4">
              <li>
                <strong>Create developer accounts</strong> on each platform (Meta Business, LinkedIn Marketing, Google Ads, TikTok Business)
              </li>
              <li>
                <strong>Register your application</strong> and obtain API credentials (Client ID, Client Secret)
              </li>
              <li>
                <strong>Configure OAuth redirect URLs</strong> pointing to your deployed application
              </li>
              <li>
                <strong>Add credentials to your .env file</strong> using the template provided
              </li>
              <li>
                <strong>Enable the feature flag</strong> by setting <code>VITE_SOCIAL_API_ENABLED=true</code>
              </li>
            </ol>
            <p className="text-apple-text-secondary mt-4">
              Detailed setup instructions for each platform are available in the <strong>SETUP.md</strong> file.
            </p>
          </div>
        </Card>
      </PageSection>
    </PageWrapper>
  )
}
