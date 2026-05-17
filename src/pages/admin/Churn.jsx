import { useState } from 'react'
import { PageWrapper } from '../../components/layout'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { Badge } from '../../components/ui/Badge'
import { useCollection, useDocument, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate, formatNumber, getTodayISO } from '../../utils/formatters'

const REASON_OPTIONS = [
  { value: 'pricing', label: 'Pricing' },
  { value: 'product_issue', label: 'Product Issue' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'no_longer_needed', label: 'No Longer Needed' },
  { value: 'other', label: 'Other' },
]

const REASON_LABELS = {
  pricing: 'Pricing',
  product_issue: 'Product Issue',
  competitor: 'Competitor',
  no_longer_needed: 'No Longer Needed',
  other: 'Other',
}

export function Churn() {
  const { documents: churnRecords, loading } = useCollection('churn')
  const { document: config } = useDocument('config', 'app')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditSales, canDeleteRecords } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    date: getTodayISO(),
    package: '',
    count: 1,
    reason: '',
    notes: '',
  })

  const packageOptions = (config?.packages || [])
    .filter(p => p.active)
    .map(p => ({ value: p.name, label: p.name }))

  const columns = [
    { key: 'date', header: 'Date', render: (val) => formatDate(val) },
    { key: 'package', header: 'Package' },
    { key: 'count', header: 'Customers', render: (val) => formatNumber(val) },
    {
      key: 'reason',
      header: 'Reason',
      render: (val) => val ? <Badge variant="warning">{REASON_LABELS[val] || val}</Badge> : '-'
    },
    { key: 'notes', header: 'Notes', render: (val) => val || '-' },
  ]

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      date: getTodayISO(),
      package: '',
      count: 1,
      reason: '',
      notes: '',
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      date: record.date || getTodayISO(),
      package: record.package || '',
      count: record.count || 1,
      reason: record.reason || '',
      notes: record.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.date || !formData.package || formData.count < 1) return

    try {
      setSaving(true)
      if (editingRecord) {
        await updateDocument('churn', editingRecord.id, formData)
      } else {
        await addDocument('churn', formData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving churn record:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      setSaving(true)
      await deleteDocument('churn', recordToDelete.id)
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting churn record:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedChurn = [...churnRecords].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date) - new Date(a.date)
  })

  return (
    <PageWrapper
      title="Customer Churn"
      subtitle="Record and track customer churn"
      actions={
        canEditSales && (
          <Button onClick={openAddModal}>
            + Add Churn Record
          </Button>
        )
      }
    >
      <DataTable
        columns={columns}
        data={sortedChurn}
        loading={loading}
        emptyMessage="No churn records yet"
        actions={canEditSales ? (row) => (
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
        title={editingRecord ? 'Edit Churn Record' : 'Add Churn Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Select
            label="Package"
            value={formData.package}
            onChange={(e) => setFormData({ ...formData, package: e.target.value })}
            options={packageOptions}
            placeholder="Select package..."
            required
          />
          <Input
            label="Number of Customers"
            type="number"
            min="1"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
            required
          />
          <Select
            label="Reason (Optional)"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            options={REASON_OPTIONS}
            placeholder="Select reason..."
          />
          <Textarea
            label="Notes (Optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRecord ? 'Update' : 'Add'} Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Churn Record"
        message="Are you sure you want to delete this churn record? This action cannot be undone."
        confirmText="Delete"
        loading={saving}
      />
    </PageWrapper>
  )
}
