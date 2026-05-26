// Meta Graph API client + normalizers for social_campaigns sync.
//
// All calls run from the browser; the access token is loaded from
// the admin-only Firestore document `social_tokens/meta`.
// We use a recent stable Graph API version.

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

export function normalizeAdAccountId(input) {
  const s = (input || '').trim()
  if (!s) return ''
  return s.startsWith('act_') ? s : `act_${s}`
}

export class MetaApiError extends Error {
  constructor(message, { status, code, type, subcode } = {}) {
    super(message)
    this.name = 'MetaApiError'
    this.status = status
    this.code = code
    this.type = type
    this.subcode = subcode
  }
}

async function graphRequest(path, params, token) {
  if (!token) throw new MetaApiError('Missing access token')
  const url = new URL(`${GRAPH_API_BASE}${path}`)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })
  url.searchParams.set('access_token', token)

  let res
  try {
    res = await fetch(url.toString(), { method: 'GET' })
  } catch (e) {
    throw new MetaApiError(`Network error contacting Meta: ${e.message}`)
  }
  let body
  try {
    body = await res.json()
  } catch {
    body = {}
  }
  if (!res.ok || body?.error) {
    const err = body?.error || {}
    throw new MetaApiError(err.message || `Graph API request failed (HTTP ${res.status})`, {
      status: res.status,
      code: err.code,
      type: err.type,
      subcode: err.error_subcode,
    })
  }
  return body
}

// ---------- Connection tests ----------

export async function testToken(token) {
  const data = await graphRequest('/me', { fields: 'id,name' }, token)
  return { id: data.id, name: data.name }
}

export async function testAdAccount(token, adAccountId) {
  const id = normalizeAdAccountId(adAccountId)
  if (!id) throw new MetaApiError('Ad Account ID is required')
  const data = await graphRequest(`/${id}`, { fields: 'name,account_status,currency,timezone_name' }, token)
  return {
    id,
    name: data.name,
    currency: data.currency,
    accountStatus: data.account_status,
    timezone: data.timezone_name,
  }
}

export async function testPage(token, pageId) {
  const id = (pageId || '').trim()
  if (!id) throw new MetaApiError('Page ID is required')
  const data = await graphRequest(`/${id}`, { fields: 'id,name,fan_count,followers_count' }, token)
  return { id: data.id, name: data.name, fanCount: data.fan_count, followersCount: data.followers_count }
}

// ---------- Fetchers ----------

const DATE_PRESETS = ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'last_90d', 'this_month', 'last_month']

export async function fetchAdInsights(token, adAccountId, { datePreset = 'last_30d' } = {}) {
  const preset = DATE_PRESETS.includes(datePreset) ? datePreset : 'last_30d'
  const id = normalizeAdAccountId(adAccountId)
  const all = []
  let path = `/${id}/insights`
  let params = {
    level: 'campaign',
    time_increment: 1,
    date_preset: preset,
    fields: 'campaign_id,campaign_name,date_start,date_stop,impressions,reach,spend,clicks,inline_link_clicks',
    limit: 500,
  }
  // Follow paging up to a safety cap so we never spin forever.
  for (let i = 0; i < 10; i++) {
    const data = await graphRequest(path, params, token)
    all.push(...(data?.data || []))
    const next = data?.paging?.next
    if (!next) break
    const u = new URL(next)
    path = u.pathname.replace(/^\/v\d+(\.\d+)?/, '')
    params = {}
    u.searchParams.forEach((v, k) => {
      if (k !== 'access_token') params[k] = v
    })
  }
  return all
}

export async function fetchPagePosts(token, pageId, { limit = 25 } = {}) {
  const id = (pageId || '').trim()
  const data = await graphRequest(`/${id}/posts`, {
    fields:
      'id,message,created_time,permalink_url,' +
      'insights.metric(post_impressions,post_impressions_unique,post_reactions_by_type_total,post_clicks),' +
      'comments.summary(true)',
    limit,
  }, token)
  return data?.data || []
}

// ---------- Normalizers (Meta → social_campaigns) ----------

export function normalizeAdInsight(row, adAccountId) {
  const linkClicks = Number(row.inline_link_clicks) || Number(row.clicks) || 0
  return {
    platform: 'meta',
    campaignName: row.campaign_name || '(unnamed campaign)',
    postTitle: '',
    date: row.date_start,
    impressions: Number(row.impressions) || 0,
    reach: Number(row.reach) || 0,
    reactions: 0,
    comments: 0,
    messages: 0,
    linkClicks,
    spend: Number(row.spend) || 0,
    notes: `Synced from Meta Ads (${adAccountId})`,
    source: 'meta_api',
    metaKind: 'ad',
    metaCampaignId: row.campaign_id || null,
    metaAdAccountId: adAccountId,
  }
}

export function normalizePagePost(post, pageId) {
  const insightArr = post?.insights?.data || []
  const insights = insightArr.reduce((acc, m) => {
    acc[m.name] = m?.values?.[0]?.value
    return acc
  }, {})

  let reactions = 0
  const rxByType = insights.post_reactions_by_type_total
  if (rxByType && typeof rxByType === 'object') {
    reactions = Object.values(rxByType).reduce((s, n) => s + (Number(n) || 0), 0)
  }

  return {
    platform: 'meta',
    campaignName: '(organic post)',
    postTitle: (post.message || '').slice(0, 140),
    date: post.created_time ? String(post.created_time).slice(0, 10) : null,
    impressions: Number(insights.post_impressions) || 0,
    reach: Number(insights.post_impressions_unique) || 0,
    reactions,
    comments: Number(post?.comments?.summary?.total_count) || 0,
    messages: 0,
    linkClicks: Number(insights.post_clicks) || 0,
    spend: 0,
    notes: post.permalink_url
      ? `Synced from Meta Page post ${post.permalink_url}`
      : `Synced from Meta Page post ${post.id || ''}`.trim(),
    source: 'meta_api',
    metaKind: 'post',
    metaPostId: post.id || null,
    metaPageId: pageId,
  }
}

// ---------- Deterministic doc IDs (for upsert) ----------

function safeId(s) {
  return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function docIdForAd(adAccountId, campaignId, dateStart) {
  return `meta_ad__${safeId(adAccountId)}__${safeId(campaignId)}__${safeId(dateStart)}`
}

export function docIdForPost(postId) {
  return `meta_post__${safeId(postId)}`
}
