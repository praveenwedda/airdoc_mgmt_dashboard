import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { usePermissions } from '../../hooks/usePermissions'

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta (Facebook/Instagram)',
    description: 'Connect a Meta System User token to sync ad campaign insights and Page posts.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
      </svg>
    ),
    color: '#1877F2',
    docsUrl: 'https://developers.facebook.com/docs/marketing-apis/',
    settingsPath: '/admin/integrations/meta',
    available: true,
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
    available: false,
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
    available: false,
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
    available: false,
  },
]

export function Integrations() {
  const { canConnectSocialAPIs } = usePermissions()
  const [connections, setConnections] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'social_tokens', 'meta'))
        if (cancelled) return
        if (snap.exists() && snap.data()?.accessToken) {
          setConnections(prev => ({ ...prev, meta: true }))
        }
      } catch (e) {
        // Ignore — rules will block non-admins; we just won't show "Connected"
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => {
          const connected = !!connections[platform.id]
          return (
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
                    {platform.available
                      ? (connected
                          ? <Badge variant="success">Connected</Badge>
                          : <Badge variant="default">Not Connected</Badge>)
                      : <Badge variant="default">Coming Soon</Badge>}
                  </div>
                  <p className="text-sm text-apple-text-secondary mb-4">
                    {platform.description}
                  </p>
                  <div className="flex items-center gap-3">
                    {platform.available && platform.settingsPath ? (
                      <Link to={platform.settingsPath}>
                        <Button variant={connected ? 'secondary' : 'primary'} size="sm">
                          {connected ? 'Manage' : 'Connect'}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        Connect
                      </Button>
                    )}
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
          )
        })}
      </div>

      <PageSection title="How sync works" className="mt-8">
        <Card>
          <ul className="text-sm text-apple-text-secondary space-y-2 list-disc pl-5">
            <li>Each platform stores its credentials under <code>social_tokens/&lt;platform&gt;</code> — admin-only by Firestore rules.</li>
            <li>Sync writes to the shared <code>social_campaigns</code> collection so synced data shows up on Backend Panel → Marketing → Social Media alongside manually entered rows.</li>
            <li>Re-syncing the same period upserts existing rows by deterministic ID (no duplicates).</li>
            <li>Sync is manual via the platform's settings page — periodic background sync is not yet enabled.</li>
          </ul>
        </Card>
      </PageSection>
    </PageWrapper>
  )
}
