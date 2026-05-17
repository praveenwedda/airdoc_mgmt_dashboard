import { useState, useRef } from 'react'
import { PageWrapper } from '../../components/layout'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { Badge } from '../../components/ui/Badge'
import { useCollection, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate, formatNumber, formatPercentage, formatCurrency, getTodayISO } from '../../utils/formatters'

const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email Campaign' },
  { value: 'sms', label: 'SMS Campaign' },
]

export function Campaigns() {
  const { documents: campaigns, loading } = useCollection('campaigns')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditMarketing, canDeleteRecords } = usePermissions()
  const fileInputRef = useRef(null)

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    type: 'email',
    name: '',
    startDate: getTodayISO(),
    endDate: '',
    reached: 0,
    delivered: 0,
    responses: 0,
    conversions: 0,
    cost: 0,
    notes: '',
  })

  const columns = [
    { key: 'name', header: 'Campaign Name' },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <Badge variant={val === 'email' ? 'primary' : 'info'}>{val === 'email' ? 'Email' : 'SMS'}</Badge>
    },
    { key: 'startDate', header: 'Date', render: (val) => formatDate(val) },
    { key: 'reached', header: 'Reached', render: (val) => formatNumber(val) },
    { key: 'delivered', header: 'Delivered', render: (val) => formatNumber(val) },
    {
      key: 'responseRate',
      header: 'Response Rate',
      render: (_, row) => formatPercentage(row.delivered > 0 ? (row.responses / row.delivered) * 100 : 0)
    },
    { key: 'cost', header: 'Cost', render: (val) => formatCurrency(val || 0) },
  ]

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      type: 'email',
      name: '',
      startDate: getTodayISO(),
      endDate: '',
      reached: 0,
      delivered: 0,
      responses: 0,
      conversions: 0,
      cost: 0,
      notes: '',
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      type: record.type || 'email',
      name: record.name || '',
      startDate: record.startDate || getTodayISO(),
      endDate: record.endDate || '',
      reached: record.reached || 0,
      delivered: record.delivered || 0,
      responses: record.responses || 0,
      conversions: record.conversions || 0,
      cost: record.cost || 0,
      notes: record.notes || '',
    })
    setShowModal(true)
  }

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        const lines = text.split('\n').filter(line => line.trim())
        // Count rows (minus header if present)
        const count = Math.max(0, lines.length - 1)
        setFormData(prev => ({ ...prev, reached: count }))
      }
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.startDate) return

    try {
      setSaving(true)
      if (editingRecord) {
        await updateDocument('campaigns', editingRecord.id, formData)
      } else {
        await addDocument('campaigns', formData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      setSaving(true)
      await deleteDocument('campaigns', recordToDelete.id)
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0
    return new Date(b.startDate) - new Date(a.startDate)
  })

  return (
    <PageWrapper
      title="Email & SMS Campaigns"
      subtitle="Track campaign performance"
      actions={
        canEditMarketing && (
          <Button onClick={openAddModal}>
            + Add Campaign
          </Button>
        )
      }
    >
      <DataTable
        columns={columns}
        data={sortedCampaigns}
        loading={loading}
        emptyMessage="No campaigns yet"
        actions={canEditMarketing ? (row) => (
          <>
            <ActionButton variant="edit" onClick={() => openEditModal(row)} title="Edit">
              <EditIcon />
            </ActionButton>
            {canDeleteRecords && (
              <ActionButton
                variant="delete"
                onClick={() => {
                  setRecordToDelete(row)
                  setShowDeleteModal(true)
                }}
                title="Delete"
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
        title={editingRecord ? 'Edit Campaign' : 'Add Campaign'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Campaign Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={CAMPAIGN_TYPES}
            />
            <Input
              label="Campaign Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q1 Newsletter"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-xs font-medium text-apple-text-secondary uppercase tracking-wide mb-1">
              Upload Contact List (CSV)
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose CSV
              </Button>
              <span className="text-sm text-apple-text-secondary">
                {formData.reached > 0 ? `${formData.reached} contacts detected` : 'No file selected'}
              </span>
            </div>
            <p className="text-xs text-apple-text-secondary mt-1">
              Only the count is stored, not the actual contact data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Reached"
              type="number"
              min="0"
              value={formData.reached}
              onChange={(e) => setFormData({ ...formData, reached: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Delivered"
              type="number"
              min="0"
              value={formData.delivered}
              onChange={(e) => setFormData({ ...formData, delivered: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Responses"
              type="number"
              min="0"
              value={formData.responses}
              onChange={(e) => setFormData({ ...formData, responses: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Conversions (Optional)"
              type="number"
              min="0"
              value={formData.conversions}
              onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <Input
            label="Campaign Cost (A$)"
            type="number"
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Campaign notes..."
          />

          {/* Calculated Metrics Preview */}
          <div className="p-4 bg-apple-bg rounded-apple-sm">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Calculated Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-apple-text-secondary">Open Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(formData.reached > 0 ? (formData.delivered / formData.reached) * 100 : 0)}
                </span>
              </div>
              <div>
                <span className="text-apple-text-secondary">Response Rate:</span>
                <span className="ml-2 font-medium">
                  {formatPercentage(formData.delivered > 0 ? (formData.responses / formData.delivered) * 100 : 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRecord ? 'Update' : 'Add'} Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone."
        confirmText="Delete"
        loading={saving}
      />
    </PageWrapper>
  )
}
