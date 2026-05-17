import { useState } from 'react'
import { PageWrapper } from '../../components/layout'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { Badge, SentimentBadge } from '../../components/ui/Badge'
import { useCollection, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate, getTodayISO } from '../../utils/formatters'

const MEETING_TYPES = [
  { value: 'existing', label: 'Existing Customer' },
  { value: 'prospect', label: 'Potential Customer (Lead)' },
]

const SENTIMENT_OPTIONS = [
  { value: 'very_positive', label: 'Very Positive' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'very_negative', label: 'Very Negative' },
]

const INTEREST_OPTIONS = [
  { value: 'very_interested', label: 'Very Interested' },
  { value: 'interested', label: 'Interested' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'rejected', label: 'Rejected' },
]

export function Meetings() {
  const { documents: meetings, loading } = useCollection('meetings')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditMarketing, canDeleteRecords } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    type: 'existing',
    date: getTodayISO(),
    company: '',
    // Existing customer fields
    attendees: '',
    summary: '',
    sentiment: '',
    actionItems: '',
    // Prospect fields
    industry: '',
    contactPerson: '',
    contactDesignation: '',
    contactEmail: '',
    contactPhone: '',
    interestLevel: '',
    nextSteps: '',
    // Common
    followUpDate: '',
  })

  const columns = [
    { key: 'date', header: 'Date', render: (val) => formatDate(val) },
    {
      key: 'type',
      header: 'Type',
      render: (val) => <Badge variant={val === 'existing' ? 'primary' : 'success'}>{val === 'existing' ? 'Customer' : 'Lead'}</Badge>
    },
    { key: 'company', header: 'Company' },
    {
      key: 'sentimentOrInterest',
      header: 'Status',
      render: (_, row) => row.type === 'existing'
        ? <SentimentBadge sentiment={row.sentiment} />
        : <SentimentBadge sentiment={row.interestLevel} />
    },
    { key: 'followUpDate', header: 'Follow-up', render: (val) => val ? formatDate(val) : '-' },
  ]

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      type: 'existing',
      date: getTodayISO(),
      company: '',
      attendees: '',
      summary: '',
      sentiment: '',
      actionItems: '',
      industry: '',
      contactPerson: '',
      contactDesignation: '',
      contactEmail: '',
      contactPhone: '',
      interestLevel: '',
      nextSteps: '',
      followUpDate: '',
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      type: record.type || 'existing',
      date: record.date || getTodayISO(),
      company: record.company || '',
      attendees: record.attendees || '',
      summary: record.summary || '',
      sentiment: record.sentiment || '',
      actionItems: record.actionItems || '',
      industry: record.industry || '',
      contactPerson: record.contactPerson || '',
      contactDesignation: record.contactDesignation || '',
      contactEmail: record.contactEmail || '',
      contactPhone: record.contactPhone || '',
      interestLevel: record.interestLevel || '',
      nextSteps: record.nextSteps || '',
      followUpDate: record.followUpDate || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.date || !formData.company) return

    try {
      setSaving(true)
      if (editingRecord) {
        await updateDocument('meetings', editingRecord.id, formData)
      } else {
        await addDocument('meetings', formData)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving meeting:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      setSaving(true)
      await deleteDocument('meetings', recordToDelete.id)
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting meeting:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedMeetings = [...meetings].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date) - new Date(a.date)
  })

  const isExisting = formData.type === 'existing'

  return (
    <PageWrapper
      title="Meeting Records"
      subtitle="Track customer and prospect meetings"
      actions={
        canEditMarketing && (
          <Button onClick={openAddModal}>
            + Add Meeting
          </Button>
        )
      }
    >
      <DataTable
        columns={columns}
        data={sortedMeetings}
        loading={loading}
        emptyMessage="No meeting records yet"
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
        title={editingRecord ? 'Edit Meeting' : 'Add Meeting'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Meeting Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={MEETING_TYPES}
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
            label="Company Name"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
            required
          />

          {isExisting ? (
            // Existing Customer Fields
            <>
              <Input
                label="Attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="Names of attendees"
              />
              <Textarea
                label="Meeting Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Summary of the meeting..."
                rows={3}
              />
              <Select
                label="Feedback/Sentiment"
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                options={SENTIMENT_OPTIONS}
                placeholder="Select sentiment..."
              />
              <Textarea
                label="Action Items"
                value={formData.actionItems}
                onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                placeholder="List of action items..."
                rows={2}
              />
            </>
          ) : (
            // Prospect/Lead Fields
            <>
              <Input
                label="Industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Healthcare, Finance"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Person"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contact name"
                />
                <Input
                  label="Designation"
                  value={formData.contactDesignation}
                  onChange={(e) => setFormData({ ...formData, contactDesignation: e.target.value })}
                  placeholder="e.g., CTO, Manager"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="email@company.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+61..."
                />
              </div>
              <Textarea
                label="Meeting Summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Summary of the meeting..."
                rows={3}
              />
              <Select
                label="Interest Level"
                value={formData.interestLevel}
                onChange={(e) => setFormData({ ...formData, interestLevel: e.target.value })}
                options={INTEREST_OPTIONS}
                placeholder="Select interest level..."
              />
              <Textarea
                label="Next Steps"
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                placeholder="What are the next steps?"
                rows={2}
              />
            </>
          )}

          <Input
            label="Follow-up Date"
            type="date"
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRecord ? 'Update' : 'Add'} Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting record? This action cannot be undone."
        confirmText="Delete"
        loading={saving}
      />
    </PageWrapper>
  )
}
