import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { useCollection, useDocument, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatCurrency, getMonthName } from '../../utils/formatters'

export function Costs() {
  const { documents: costs, loading } = useCollection('costs')
  const { document: config } = useDocument('config', 'app')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditCosts, canDeleteRecords } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const currentDate = new Date()
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    fixedCosts: [],
    variableCosts: [],
    adHocCosts: [],
  })

  // Initialize form with config fixed/variable costs
  useEffect(() => {
    if (config && !editingRecord) {
      setFormData(prev => ({
        ...prev,
        fixedCosts: (config.fixedCosts || []).map(c => ({
          name: c.name,
          budgeted: c.monthlyAmount || 0,
          actual: 0,
        })),
        variableCosts: (config.variableCosts || []).map(c => ({
          name: c.name,
          unitDriver: c.unitDriver,
          unitCost: c.unitCost || 0,
          units: 0,
          total: 0,
        })),
      }))
    }
  }, [config, editingRecord])

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i),
  }))

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentDate.getFullYear() - 2 + i,
    label: (currentDate.getFullYear() - 2 + i).toString(),
  }))

  const columns = [
    {
      key: 'period',
      header: 'Period',
      render: (_, row) => `${getMonthName(row.month - 1)} ${row.year}`,
    },
    {
      key: 'fixedTotal',
      header: 'Fixed Costs',
      render: (_, row) => formatCurrency(row.fixedCosts?.reduce((sum, c) => sum + (c.actual || 0), 0) || 0),
    },
    {
      key: 'variableTotal',
      header: 'Variable Costs',
      render: (_, row) => formatCurrency(row.variableCosts?.reduce((sum, c) => sum + (c.total || 0), 0) || 0),
    },
    {
      key: 'adHocTotal',
      header: 'Ad Hoc Costs',
      render: (_, row) => formatCurrency(row.adHocCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0),
    },
    {
      key: 'total',
      header: 'Total',
      render: (_, row) => {
        const fixed = row.fixedCosts?.reduce((sum, c) => sum + (c.actual || 0), 0) || 0
        const variable = row.variableCosts?.reduce((sum, c) => sum + (c.total || 0), 0) || 0
        const adHoc = row.adHocCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        return <span className="font-semibold">{formatCurrency(fixed + variable + adHoc)}</span>
      },
    },
  ]

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      fixedCosts: (config?.fixedCosts || []).map(c => ({
        name: c.name,
        budgeted: c.monthlyAmount || 0,
        actual: 0,
      })),
      variableCosts: (config?.variableCosts || []).map(c => ({
        name: c.name,
        unitDriver: c.unitDriver,
        unitCost: c.unitCost || 0,
        units: 0,
        total: 0,
      })),
      adHocCosts: [],
    })
    setShowModal(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      month: record.month,
      year: record.year,
      fixedCosts: record.fixedCosts || [],
      variableCosts: record.variableCosts || [],
      adHocCosts: record.adHocCosts || [],
    })
    setShowModal(true)
  }

  const updateFixedCost = (index, value) => {
    const updated = [...formData.fixedCosts]
    updated[index] = { ...updated[index], actual: parseFloat(value) || 0 }
    setFormData({ ...formData, fixedCosts: updated })
  }

  const updateVariableCost = (index, units) => {
    const updated = [...formData.variableCosts]
    const unitCount = parseInt(units) || 0
    updated[index] = {
      ...updated[index],
      units: unitCount,
      total: unitCount * (updated[index].unitCost || 0),
    }
    setFormData({ ...formData, variableCosts: updated })
  }

  const addAdHocCost = () => {
    setFormData({
      ...formData,
      adHocCosts: [...formData.adHocCosts, { name: '', amount: 0, category: '' }],
    })
  }

  const updateAdHocCost = (index, field, value) => {
    const updated = [...formData.adHocCosts]
    updated[index] = { ...updated[index], [field]: field === 'amount' ? (parseFloat(value) || 0) : value }
    setFormData({ ...formData, adHocCosts: updated })
  }

  const removeAdHocCost = (index) => {
    setFormData({
      ...formData,
      adHocCosts: formData.adHocCosts.filter((_, i) => i !== index),
    })
  }

  const calculateTotal = () => {
    const fixed = formData.fixedCosts.reduce((sum, c) => sum + (c.actual || 0), 0)
    const variable = formData.variableCosts.reduce((sum, c) => sum + (c.total || 0), 0)
    const adHoc = formData.adHocCosts.reduce((sum, c) => sum + (c.amount || 0), 0)
    return fixed + variable + adHoc
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const data = {
        ...formData,
        total: calculateTotal(),
      }
      if (editingRecord) {
        await updateDocument('costs', editingRecord.id, data)
      } else {
        await addDocument('costs', data)
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving costs:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recordToDelete) return
    try {
      setSaving(true)
      await deleteDocument('costs', recordToDelete.id)
      setShowDeleteModal(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting cost record:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedCosts = [...costs].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const baseline = config?.targets?.expenditureBaseline || 0

  return (
    <PageWrapper
      title="Cost Recording"
      subtitle="Track monthly costs and expenditure"
      actions={
        canEditCosts && (
          <Button onClick={openAddModal}>
            + Record Costs
          </Button>
        )
      }
    >
      {/* Summary Card */}
      {costs.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-apple-text-secondary">Monthly Baseline</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(baseline)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-apple-text-secondary">Latest Month Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  sortedCosts[0]?.fixedCosts?.reduce((sum, c) => sum + (c.actual || 0), 0) +
                  sortedCosts[0]?.variableCosts?.reduce((sum, c) => sum + (c.total || 0), 0) +
                  sortedCosts[0]?.adHocCosts?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={sortedCosts}
        loading={loading}
        emptyMessage="No cost records yet"
        actions={canEditCosts ? (row) => (
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
        title={editingRecord ? 'Edit Cost Record' : 'Record Monthly Costs'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              options={monthOptions}
            />
            <Select
              label="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              options={yearOptions}
            />
          </div>

          {/* Fixed Costs */}
          {formData.fixedCosts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Fixed Costs</h4>
              <div className="space-y-3">
                {formData.fixedCosts.map((cost, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="flex-1 text-sm text-gray-700">{cost.name}</span>
                    <span className="text-xs text-apple-text-secondary">Budget: {formatCurrency(cost.budgeted)}</span>
                    <Input
                      type="number"
                      value={cost.actual}
                      onChange={(e) => updateFixedCost(index, e.target.value)}
                      placeholder="Actual"
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variable Costs */}
          {formData.variableCosts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Variable Costs</h4>
              <div className="space-y-3">
                {formData.variableCosts.map((cost, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="flex-1 text-sm text-gray-700">
                      {cost.name}
                      <span className="text-xs text-apple-text-secondary ml-2">
                        ({cost.unitDriver} @ {formatCurrency(cost.unitCost)})
                      </span>
                    </span>
                    <Input
                      type="number"
                      value={cost.units}
                      onChange={(e) => updateVariableCost(index, e.target.value)}
                      placeholder="Units"
                      className="w-24"
                    />
                    <span className="text-sm font-medium w-24 text-right">{formatCurrency(cost.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ad Hoc Costs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Ad Hoc Costs</h4>
              <Button type="button" variant="secondary" size="sm" onClick={addAdHocCost}>
                + Add
              </Button>
            </div>
            {formData.adHocCosts.length > 0 ? (
              <div className="space-y-3">
                {formData.adHocCosts.map((cost, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <Input
                      label={index === 0 ? 'Name' : undefined}
                      value={cost.name}
                      onChange={(e) => updateAdHocCost(index, 'name', e.target.value)}
                      placeholder="Cost name"
                      className="flex-1"
                    />
                    <Input
                      label={index === 0 ? 'Category' : undefined}
                      value={cost.category}
                      onChange={(e) => updateAdHocCost(index, 'category', e.target.value)}
                      placeholder="Category"
                      className="w-32"
                    />
                    <Input
                      label={index === 0 ? 'Amount' : undefined}
                      type="number"
                      value={cost.amount}
                      onChange={(e) => updateAdHocCost(index, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeAdHocCost(index)}
                      className="p-2 text-apple-red hover:bg-red-50 rounded-lg mb-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-apple-text-secondary">No ad hoc costs added.</p>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-apple-border-light">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-apple-blue">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRecord ? 'Update' : 'Save'} Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Cost Record"
        message="Are you sure you want to delete this cost record? This action cannot be undone."
        confirmText="Delete"
        loading={saving}
      />
    </PageWrapper>
  )
}
