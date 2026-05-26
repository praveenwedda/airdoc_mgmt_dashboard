import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card, KPICard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { PlatformBadge, Badge } from '../../components/ui/Badge'
import { useCollection, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate, formatNumber, formatCurrency, getTodayISO } from '../../utils/formatters'

const PLATFORM_OPTIONS = [
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok' },
]

export function SocialMedia() {
  const { documents: socialCampaigns, loading } = useCollection('social_campaigns')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditMarketing, canDeleteRecords } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    platform: 'meta',
    campaignName: '',
    postTitle: '',
    date: getTodayISO(),
    impressions: 0,
    reach: 0,
    reactions: 0,
    comments: 0,
    messages: 0,
    linkClicks: 0,
    spend: 0,
    notes: '',
    source: 'manual',
  })

  // Calculate totals
  const totals = socialCampaigns.reduce((acc, c) => ({
    impressions: acc.impressions + (c.impressions || 0),
    reach: acc.reach + (c.reach || 0),
    messages: acc.messages + (c.messages || 0),
    spend: acc.spend + (c.spend || 0),
  }), { impressions: 0, reach: 0, messages: 0, spend: 0 })

  const columns = [
    { key: 'date', header: 'Date', render: (val) => formatDate(val) },
    { key: 'platform', header: 'Platform', render: (val) => <PlatformBadge platform={val} /> },
    { key: 'campaignName', header: 'Campaign' },
    { key: 'impressions', header: 'Impressions', render: (val) => formatNumber(val || 0) },
    { key: 'reach', header: 'Reach', render: (val) => formatNumber(val || 0) },
    { key: 'messages', header: 'Messages', render: (val) => formatNumber(val || 0) },
    { key: 'spend', header: 'Spend', render: (val) => formatCurrency(val || 0) },
    {
      key: 'source',
      header: 'Source',
      render: (val) => {
        if (val === 'meta_api') return <Badge variant="primary">Meta API</Badge>
        if (val === 'api') return <Badge variant="primary">API</Badge>
        return <Badge variant="default">Manual</Badge>
      },
    },
  ]

  const isApiSourced = (row) => row?.source === 'meta_api' || row?.source === 'api'

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      platform: 'meta',
      campaignName: '',
      postTitle: '',
      date: getTodayISO(),
      impressions: 0,
      reach: 0,
      reactions: 0,
      comments: 0,
      messages: 0,
      linkClicks: 0,
      spend: 0,
      notes: '',
      source: 'manual',
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      platform: record.platform || 'meta',
      campaignName: record.campaignName || '',
      postTitle: record.postTitle || '',
      date: record.date || getTodayISO(),
      impressions: record.impressions || 0,
      reach: record.reach || 0,
      reactions: record.reactions || 0,
      comments: record.comments || 0,
      messages: record.messages || 0,
      linkClicks: record.linkClicks || 0,
      spend: record.spend || 0,
      notes: record.notes || '',
      source: record.source || 'manual',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.campaignName || !formData.date) return

    try {
      setSaving(true)
      if (editingRecord) {
        await updateDocument('social_campaigns', editingRecord.id, formData)
      } else {
        await addDocument('social_campaigns', formData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving social campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      setSaving(true)
      await deleteDocument('social_campaigns', recordToDelete.id)
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting social campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedCampaigns = [...socialCampaigns].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date) - new Date(a.date)
  })

  return (
    <PageWrapper
      title="Social Media Campaigns"
      subtitle="Track social media advertising performance"
      actions={
        <div className="flex items-center gap-3">
          <Link to="/admin/integrations/meta" className="text-sm text-apple-blue hover:underline">
            Manage Meta connection →
          </Link>
          {canEditMarketing && (
            <Button onClick={openAddModal}>
              + Add Entry
            </Button>
          )}
        </div>
      }
    >
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Impressions"
          value={formatNumber(totals.impressions)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <KPICard
          title="Total Reach"
          value={formatNumber(totals.reach)}
        />
        <KPICard
          title="Total Messages"
          value={formatNumber(totals.messages)}
        />
        <KPICard
          title="Total Ad Spend"
          value={formatCurrency(totals.spend)}
        />
      </div>

      <DataTable
        columns={columns}
        data={sortedCampaigns}
        loading={loading}
        emptyMessage="No social media campaigns yet"
        actions={canEditMarketing ? (row) => (
          <>
            {!isApiSourced(row) && (
              <ActionButton variant="edit" onClick={() => openEditModal(row)} title="Edit">
                <EditIcon />
              </ActionButton>
            )}
            {canDeleteRecords && (
              <ActionButton
                variant="delete"
                onClick={() => {
                  setRecordToDelete(row)
                  setShowDeleteModal(true)
                }}
                title={isApiSourced(row) ? 'Delete (will reappear on next sync)' : 'Delete'}
              >
                <DeleteIcon />
              </ActionButton>
            )}
          </>
        ) : undefined}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecord ? 'Edit Social Media Entry' : 'Add Social Media Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={PLATFORM_OPTIONS}
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Campaign Name"
            value={formData.campaignName}
            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
            placeholder="e.g., Brand Awareness Q1"
            required
          />

          <Input
            label="Post/Ad Title"
            value={formData.postTitle}
            onChange={(e) => setFormData({ ...formData, postTitle: e.target.value })}
            placeholder="Specific post or ad title"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Impressions"
              type="number"
              min="0"
              value={formData.impressions}
              onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Reach"
              type="number"
              min="0"
              value={formData.reach}
              onChange={(e) => setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Reactions/Likes"
              type="number"
              min="0"
              value={formData.reactions}
              onChange={(e) => setFormData({ ...formData, reactions: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Comments"
              type="number"
              min="0"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Messages/Leads"
              type="number"
              min="0"
              value={formData.messages}
              onChange={(e) => setFormData({ ...formData, messages: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Link Clicks"
              type="number"
              min="0"
              value={formData.linkClicks}
              onChange={(e) => setFormData({ ...formData, linkClicks: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Ad Spend (A$)"
              type="number"
              min="0"
              step="0.01"
              value={formData.spend}
              onChange={(e) => setFormData({ ...formData, spend: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRecord ? 'Update' : 'Add'} Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        loading={saving}
      />
    </PageWrapper>
  )
}
