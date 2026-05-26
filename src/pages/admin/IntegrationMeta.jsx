import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'
import { formatDateTime, formatNumber } from '../../utils/formatters'
import {
  testToken,
  testAdAccount,
  testPage,
  fetchAdInsights,
  fetchPagePosts,
  normalizeAdInsight,
  normalizePagePost,
  normalizeAdAccountId,
  docIdForAd,
  docIdForPost,
  MetaApiError,
} from '../../services/metaApi'

const TOKEN_DOC = ['social_tokens', 'meta']

const DATE_PRESETS = [
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_14d', label: 'Last 14 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
]

function StatusDot({ state }) {
  // state: 'idle' | 'ok' | 'fail'
  const color =
    state === 'ok' ? 'bg-apple-green' :
    state === 'fail' ? 'bg-apple-red' :
    'bg-apple-border'
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
}

export function IntegrationMeta() {
  const { canConnectSocialAPIs } = usePermissions()
  const { currentUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const [form, setForm] = useState({
    accessToken: '',
    adAccountId: '',
    pageId: '',
  })

  // Status from the last test/sync
  const [testStatus, setTestStatus] = useState({
    token: 'idle',
    adAccount: 'idle',
    page: 'idle',
    tokenInfo: null,
    adAccountInfo: null,
    pageInfo: null,
    error: '',
  })
  const [syncStatus, setSyncStatus] = useState({ message: '', error: '' })
  const [datePreset, setDatePreset] = useState('last_30d')
  const [postLimit, setPostLimit] = useState(25)

  // Persisted state from social_tokens/meta
  const [persisted, setPersisted] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const snap = await getDoc(doc(db, ...TOKEN_DOC))
        if (cancelled) return
        if (snap.exists()) {
          const data = snap.data()
          setPersisted(data)
          setForm({
            accessToken: data.accessToken || '',
            adAccountId: data.adAccountId || '',
            pageId: data.pageId || '',
          })
        }
      } catch (e) {
        // Likely permissions; surface nothing destructive
        console.error('Could not load Meta token doc:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const connected = !!persisted?.accessToken
  const ready = useMemo(
    () => form.accessToken.trim() && form.adAccountId.trim() && form.pageId.trim(),
    [form]
  )

  const handleTest = async () => {
    setTesting(true)
    setTestStatus({
      token: 'idle', adAccount: 'idle', page: 'idle',
      tokenInfo: null, adAccountInfo: null, pageInfo: null, error: '',
    })
    try {
      const next = {
        token: 'idle', adAccount: 'idle', page: 'idle',
        tokenInfo: null, adAccountInfo: null, pageInfo: null, error: '',
      }
      // 1. Token
      try {
        next.tokenInfo = await testToken(form.accessToken.trim())
        next.token = 'ok'
      } catch (e) {
        next.token = 'fail'
        next.error = e.message || 'Token test failed'
        setTestStatus({ ...next })
        return
      }
      // 2. Ad Account
      try {
        next.adAccountInfo = await testAdAccount(form.accessToken.trim(), form.adAccountId.trim())
        next.adAccount = 'ok'
      } catch (e) {
        next.adAccount = 'fail'
        next.error = `Ad Account: ${e.message}`
      }
      // 3. Page
      try {
        next.pageInfo = await testPage(form.accessToken.trim(), form.pageId.trim())
        next.page = 'ok'
      } catch (e) {
        next.page = 'fail'
        next.error = next.error ? `${next.error}  •  Page: ${e.message}` : `Page: ${e.message}`
      }
      setTestStatus(next)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, ...TOKEN_DOC), {
        platform: 'meta',
        accessToken: form.accessToken.trim(),
        adAccountId: normalizeAdAccountId(form.adAccountId),
        pageId: form.pageId.trim(),
        connectedAt: persisted?.connectedAt || serverTimestamp(),
        connectedBy: persisted?.connectedBy || currentUser?.uid || null,
        lastTest: {
          at: serverTimestamp(),
          tokenInfo: testStatus.tokenInfo || null,
          adAccountInfo: testStatus.adAccountInfo || null,
          pageInfo: testStatus.pageInfo || null,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true })
      // Reload
      const snap = await getDoc(doc(db, ...TOKEN_DOC))
      if (snap.exists()) setPersisted(snap.data())
    } catch (e) {
      console.error('Error saving Meta credentials:', e)
      setTestStatus(prev => ({ ...prev, error: `Save failed: ${e.message}` }))
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await deleteDoc(doc(db, ...TOKEN_DOC))
      setPersisted(null)
      setForm({ accessToken: '', adAccountId: '', pageId: '' })
      setTestStatus({
        token: 'idle', adAccount: 'idle', page: 'idle',
        tokenInfo: null, adAccountInfo: null, pageInfo: null, error: '',
      })
      setShowDisconnect(false)
    } catch (e) {
      console.error('Error disconnecting:', e)
    }
  }

  const handleSync = async () => {
    if (!persisted?.accessToken) {
      setSyncStatus({ message: '', error: 'Save your credentials first.' })
      return
    }
    setSyncing(true)
    setSyncStatus({ message: '', error: '' })
    const token = persisted.accessToken
    const adAccountId = persisted.adAccountId
    const pageId = persisted.pageId

    let adCount = 0
    let postCount = 0
    const errors = []

    try {
      // 1. Ad campaign insights (daily, per campaign)
      try {
        const rows = await fetchAdInsights(token, adAccountId, { datePreset })
        for (const row of rows) {
          const id = docIdForAd(adAccountId, row.campaign_id, row.date_start)
          const docData = {
            ...normalizeAdInsight(row, adAccountId),
            syncedAt: serverTimestamp(),
            syncedBy: currentUser?.uid || null,
          }
          await setDoc(doc(db, 'social_campaigns', id), docData, { merge: true })
          adCount++
        }
      } catch (e) {
        errors.push(`Ads: ${e.message}`)
      }

      // 2. Organic page posts
      try {
        const posts = await fetchPagePosts(token, pageId, { limit: Number(postLimit) || 25 })
        for (const post of posts) {
          if (!post?.id) continue
          const id = docIdForPost(post.id)
          const docData = {
            ...normalizePagePost(post, pageId),
            syncedAt: serverTimestamp(),
            syncedBy: currentUser?.uid || null,
          }
          await setDoc(doc(db, 'social_campaigns', id), docData, { merge: true })
          postCount++
        }
      } catch (e) {
        errors.push(`Posts: ${e.message}`)
      }

      // 3. Update the token doc with sync metadata
      await setDoc(doc(db, ...TOKEN_DOC), {
        lastSync: {
          at: serverTimestamp(),
          datePreset,
          adCount,
          postCount,
          errors,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true })

      const snap = await getDoc(doc(db, ...TOKEN_DOC))
      if (snap.exists()) setPersisted(snap.data())

      if (errors.length === 0) {
        setSyncStatus({
          message: `Synced ${formatNumber(adCount)} ad rows and ${formatNumber(postCount)} posts.`,
          error: '',
        })
      } else {
        setSyncStatus({
          message: `Partial sync: ${adCount} ad rows, ${postCount} posts.`,
          error: errors.join('  •  '),
        })
      }
    } finally {
      setSyncing(false)
    }
  }

  if (!canConnectSocialAPIs) {
    return (
      <PageWrapper title="Meta Integration">
        <div className="text-center py-12">
          <p className="text-apple-text-secondary">You do not have permission to access this page.</p>
        </div>
      </PageWrapper>
    )
  }

  const lastSync = persisted?.lastSync
  const lastSyncAt = lastSync?.at?.toDate ? lastSync.at.toDate() : null
  const connectedAt = persisted?.connectedAt?.toDate ? persisted.connectedAt.toDate() : null

  return (
    <PageWrapper
      title="Meta (Facebook & Instagram)"
      subtitle="Connect your Meta ad account and Page to sync campaigns and post insights"
      actions={
        <div className="flex items-center gap-3">
          <Link to="/admin/integrations" className="text-sm text-apple-blue hover:underline">
            ← Back to integrations
          </Link>
          {connected && (
            <Button variant="secondary" onClick={() => setShowDisconnect(true)}>
              Disconnect
            </Button>
          )}
        </div>
      }
    >
      {/* Connection header */}
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#1877F215', color: '#1877F2' }}>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.78-3.92 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-gray-900">Meta Marketing & Page Insights</h2>
                {connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="default">Not Connected</Badge>
                )}
              </div>
              {connected && (
                <p className="text-xs text-apple-text-secondary">
                  {persisted?.lastTest?.adAccountInfo?.name && (
                    <>Ad account: <span className="text-gray-700">{persisted.lastTest.adAccountInfo.name}</span> ({persisted.adAccountId}) • </>
                  )}
                  {persisted?.lastTest?.pageInfo?.name && (
                    <>Page: <span className="text-gray-700">{persisted.lastTest.pageInfo.name}</span></>
                  )}
                  {connectedAt && <> • Connected {formatDateTime(connectedAt)}</>}
                </p>
              )}
            </div>
          </div>
          <div className="text-xs text-apple-text-secondary">
            {lastSyncAt
              ? <>Last sync: <span className="text-gray-700">{formatDateTime(lastSyncAt)}</span> ({formatNumber(lastSync?.adCount || 0)} ads, {formatNumber(lastSync?.postCount || 0)} posts)</>
              : <>No sync yet</>}
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <PageSection title="How to connect">
        <Card>
          <ol className="text-sm text-gray-700 space-y-3 list-decimal pl-5">
            <li>
              Go to <a className="text-apple-blue hover:underline" href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">Meta Business → System Users</a>{' '}
              and create (or use an existing) <strong>System User</strong>. Avoid using your personal Facebook session token.
            </li>
            <li>
              Assign the System User to the ad account you want to sync, and add the <strong>Page</strong> you want to read posts from.
            </li>
            <li>
              Click <strong>Generate New Token</strong> on the System User. Pick your Meta App, set token expiry to <em>Never</em>, and grant these permissions:
              <ul className="list-disc pl-6 mt-1 text-apple-text-secondary">
                <li><code>ads_read</code> — for Marketing API insights</li>
                <li><code>pages_read_engagement</code> — for Page post insights</li>
                <li><code>business_management</code> — for ad account metadata</li>
              </ul>
            </li>
            <li>
              Copy the token into <strong>Access Token</strong> below.
            </li>
            <li>
              Find your <strong>Ad Account ID</strong> in <a className="text-apple-blue hover:underline" href="https://adsmanager.facebook.com/" target="_blank" rel="noopener noreferrer">Ads Manager</a> (top-left selector). It looks like <code>act_1234567890</code> — paste the digits or the full <code>act_…</code> form.
            </li>
            <li>
              Find your <strong>Page ID</strong> on the Page → <em>About</em> tab, or in <a className="text-apple-blue hover:underline" href="https://business.facebook.com/settings/pages" target="_blank" rel="noopener noreferrer">Business Settings → Pages</a>.
            </li>
            <li>
              Paste everything below, click <strong>Test Connection</strong>, then <strong>Save</strong>, then <strong>Sync Now</strong>.
            </li>
          </ol>
          <div className="mt-4 p-3 rounded-apple-sm bg-amber-50 border border-amber-200 text-xs text-amber-800">
            The token is stored in Firestore under <code>social_tokens/meta</code> and is readable only by admins (per <code>firestore.rules</code>). Anyone who has admin access to this dashboard can read it — treat it like a production secret.
          </div>
        </Card>
      </PageSection>

      {/* Credentials form */}
      <PageSection title="Credentials">
        <Card>
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Access Token"
                type={showToken ? 'text' : 'password'}
                value={form.accessToken}
                onChange={(e) => setForm(prev => ({ ...prev, accessToken: e.target.value }))}
                placeholder="EAAB… long-lived system user token"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken(s => !s)}
                className="absolute right-3 top-8 text-xs text-apple-blue hover:underline"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ad Account ID"
                value={form.adAccountId}
                onChange={(e) => setForm(prev => ({ ...prev, adAccountId: e.target.value }))}
                placeholder="act_1234567890 or 1234567890"
              />
              <Input
                label="Page ID"
                value={form.pageId}
                onChange={(e) => setForm(prev => ({ ...prev, pageId: e.target.value }))}
                placeholder="1234567890"
              />
            </div>

            {/* Test results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-apple-sm bg-apple-bg">
                <StatusDot state={testStatus.token} />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Token</div>
                  <div className="text-xs text-apple-text-secondary">
                    {testStatus.tokenInfo?.name || (testStatus.token === 'fail' ? 'Invalid' : 'Not tested')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-apple-sm bg-apple-bg">
                <StatusDot state={testStatus.adAccount} />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Ad Account</div>
                  <div className="text-xs text-apple-text-secondary">
                    {testStatus.adAccountInfo
                      ? `${testStatus.adAccountInfo.name} (${testStatus.adAccountInfo.currency || ''})`
                      : (testStatus.adAccount === 'fail' ? 'No access' : 'Not tested')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-apple-sm bg-apple-bg">
                <StatusDot state={testStatus.page} />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Page</div>
                  <div className="text-xs text-apple-text-secondary">
                    {testStatus.pageInfo
                      ? testStatus.pageInfo.name
                      : (testStatus.page === 'fail' ? 'No access' : 'Not tested')}
                  </div>
                </div>
              </div>
            </div>

            {testStatus.error && (
              <div className="p-3 rounded-apple-sm bg-red-50 text-sm text-apple-red">
                {testStatus.error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="secondary" onClick={handleTest} loading={testing} disabled={!ready}>
                Test Connection
              </Button>
              <Button onClick={handleSave} loading={saving} disabled={!ready}>
                {connected ? 'Update Credentials' : 'Save & Connect'}
              </Button>
              {!ready && (
                <span className="text-xs text-apple-text-secondary">
                  Fill in all three fields to enable testing and saving.
                </span>
              )}
            </div>
          </div>
        </Card>
      </PageSection>

      {/* Sync */}
      <PageSection title="Sync data">
        <Card>
          {!connected ? (
            <p className="text-sm text-apple-text-secondary">Save your credentials above first, then come back here to pull data.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Ad insights date range"
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  options={DATE_PRESETS}
                />
                <Input
                  label="Page posts (most recent)"
                  type="number"
                  min="1"
                  max="100"
                  value={postLimit}
                  onChange={(e) => setPostLimit(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSync} loading={syncing}>
                  Sync Now
                </Button>
                <span className="text-xs text-apple-text-secondary">
                  Writes to <code>social_campaigns</code>. Re-syncing the same period upserts existing rows (no duplicates).
                </span>
              </div>
              {syncStatus.message && (
                <div className="p-3 rounded-apple-sm bg-green-50 text-sm text-apple-green">
                  {syncStatus.message}
                </div>
              )}
              {syncStatus.error && (
                <div className="p-3 rounded-apple-sm bg-red-50 text-sm text-apple-red">
                  {syncStatus.error}
                </div>
              )}
              {lastSync?.errors?.length > 0 && !syncStatus.error && (
                <div className="p-3 rounded-apple-sm bg-amber-50 text-sm text-amber-800">
                  Last sync had warnings: {lastSync.errors.join('  •  ')}
                </div>
              )}
            </div>
          )}
        </Card>
      </PageSection>

      <ConfirmModal
        isOpen={showDisconnect}
        onClose={() => setShowDisconnect(false)}
        onConfirm={handleDisconnect}
        title="Disconnect Meta?"
        message="This removes the stored token. Previously synced records in social_campaigns are kept. You can reconnect anytime."
        confirmText="Disconnect"
      />
    </PageWrapper>
  )
}
