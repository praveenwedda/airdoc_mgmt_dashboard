import { useState, useEffect, useMemo, useRef } from 'react'
import { PageWrapper } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { Badge } from '../../components/ui/Badge'
import { useCollection, useDocument, useFirestoreOperations } from '../../hooks/useFirestore'
import { usePermissions } from '../../hooks/usePermissions'
import { formatCurrency, getMonthName } from '../../utils/formatters'
import { computeLinkedCosts, sumLinkedCosts, sumManualCosts } from '../../utils/calculations'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'

export function Costs() {
  const { documents: costs, loading } = useCollection('costs')
  const { documents: campaigns } = useCollection('campaigns')
  const { documents: socialCampaigns } = useCollection('social_campaigns')
  const { document: config } = useDocument('config', 'app')
  const { addDocument, updateDocument, deleteDocument } = useFirestoreOperations()
  const { canEditCosts, canDeleteRecords } = usePermissions()
  const { currentUser } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const bootstrappedRef = useRef(false)

  const currentDate = new Date()
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    fixedCosts: [],
    variableCosts: [],
    adHocCosts: [],
  })

  // Auto-create a draft cost record for the current month if none exists,
  // pre-populated with fixed costs from the configuration. The admin/manager
  // can edit values from the row's edit action.
  useEffect(() => {
    if (loading || !config || bootstrappedRef.current) return
    if (!canEditCosts) return
    const m = currentDate.getMonth() + 1
    const y = currentDate.getFullYear()
    const existing = costs.find(c => c.month === m && c.year === y)
    if (existing) {
      bootstrappedRef.current = true
      return
    }
    bootstrappedRef.current = true
    const seededFixed = (config.fixedCosts || []).map(c => ({
      name: c.name,
      budgeted: c.monthlyAmount || 0,
      actual: c.monthlyAmount || 0,
    }))
    const seededVariable = (config.variableCosts || []).map(c => ({
      name: c.name,
      unitDriver: c.unitDriver,
      unitCost: c.unitCost || 0,
      units: 0,
      total: 0,
    }))
    const seededFixedTotal = seededFixed.reduce((s, c) => s + (c.actual || 0), 0)
    // Deterministic doc ID — if two managers race, both write to the same
    // document and the second simply overwrites with identical seed data,
    // so we end up with exactly one auto-seeded record per month.
    const seedId = `auto-${y}-${String(m).padStart(2, '0')}`
    setDoc(doc(db, 'costs', seedId), {
      month: m,
      year: y,
      fixedCosts: seededFixed,
      variableCosts: seededVariable,
      adHocCosts: [],
      total: seededFixedTotal,
      autoSeeded: true,
      createdBy: currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: false }).catch(err => console.error('Error seeding current-month costs:', err))
  }, [loading, config, costs, canEditCosts, currentUser])

  // Map of "YYYY-M" => linked cost array, recomputed when campaigns/social change
  const linkedByMonth = useMemo(() => {
    const map = new Map()
    const seen = new Set()
    const collect = (m, y) => {
      const key = `${y}-${m}`
      if (seen.has(key)) return
      seen.add(key)
      map.set(key, computeLinkedCosts(m, y, campaigns, socialCampaigns))
    }
    costs.forEach(c => collect(c.month, c.year))
    // Also include any campaign/social months that don't have a manual record yet
    campaigns.forEach(c => {
      if (!c?.startDate || !c.cost) return
      const d = new Date(c.startDate)
      if (!isNaN(d)) collect(d.getMonth() + 1, d.getFullYear())
    })
    socialCampaigns.forEach(s => {
      if (!s?.date || !s.spend) return
      const d = new Date(s.date)
      if (!isNaN(d)) collect(d.getMonth() + 1, d.getFullYear())
    })
    return map
  }, [costs, campaigns, socialCampaigns])

  // Combine cost records with linked-only "virtual" rows for months that
  // have marketing spend but no manual record yet.
  const combinedRows = useMemo(() => {
    const rows = costs.map(c => {
      const key = `${c.year}-${c.month}`
      const linkedItems = linkedByMonth.get(key) || []
      return { ...c, linkedItems, _virtual: false }
    })
    const recordedKeys = new Set(rows.map(r => `${r.year}-${r.month}`))
    linkedByMonth.forEach((items, key) => {
      if (recordedKeys.has(key) || items.length === 0) return
      const [y, m] = key.split('-').map(Number)
      rows.push({
        id: `linked-${key}`,
        month: m,
        year: y,
        fixedCosts: [],
        variableCosts: [],
        adHocCosts: [],
        linkedItems: items,
        _virtual: true,
      })
    })
    return rows
  }, [costs, linkedByMonth])

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
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span>{getMonthName(row.month - 1)} {row.year}</span>
          {row.autoSeeded && !row._virtual && (
            <Badge variant="default" size="sm">Auto</Badge>
          )}
          {row._virtual && (
            <Badge variant="warning" size="sm">Not recorded</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'fixedTotal',
      header: 'Fixed',
      render: (_, row) => formatCurrency(sumManualCosts(row).fixed),
    },
    {
      key: 'variableTotal',
      header: 'Variable',
      render: (_, row) => formatCurrency(sumManualCosts(row).variable),
    },
    {
      key: 'adHocTotal',
      header: 'Ad Hoc',
      render: (_, row) => formatCurrency(sumManualCosts(row).adHoc),
    },
    {
      key: 'linkedTotal',
      header: 'Marketing (linked)',
      render: (_, row) => {
        const total = sumLinkedCosts(row.linkedItems)
        if (total === 0) return <span className="text-apple-text-secondary">—</span>
        return (
          <div className="flex items-center gap-2">
            <span>{formatCurrency(total)}</span>
            <Badge variant="info" size="sm">{row.linkedItems.length}</Badge>
          </div>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      render: (_, row) => {
        const { fixed, variable, adHoc } = sumManualCosts(row)
        const linked = sumLinkedCosts(row.linkedItems)
        return <span className="font-semibold">{formatCurrency(fixed + variable + adHoc + linked)}</span>
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
        actual: c.monthlyAmount || 0,
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
    // If a virtual (linked-only) row is being edited, seed a real record
    // from config so the manager can persist adjustments.
    if (record._virtual) {
      setEditingRecord(null)
      setFormData({
        month: record.month,
        year: record.year,
        fixedCosts: (config?.fixedCosts || []).map(c => ({
          name: c.name,
          budgeted: c.monthlyAmount || 0,
          actual: c.monthlyAmount || 0,
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
      return
    }
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

  const linkedForForm = useMemo(
    () => computeLinkedCosts(formData.month, formData.year, campaigns, socialCampaigns),
    [formData.month, formData.year, campaigns, socialCampaigns]
  )
  const linkedFormTotal = sumLinkedCosts(linkedForForm)

  const manualTotal = () => {
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
        total: manualTotal(),
        autoSeeded: false,
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

  const sortedRows = [...combinedRows].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const baseline = config?.targets?.expenditureBaseline || 0
  const latestRow = sortedRows[0]
  const latestTotal = latestRow
    ? (() => {
        const { fixed, variable, adHoc } = sumManualCosts(latestRow)
        return fixed + variable + adHoc + sumLinkedCosts(latestRow.linkedItems)
      })()
    : 0

  return (
    <PageWrapper
      title="Cost Recording"
      subtitle="Track monthly costs — fixed, variable, ad hoc, and marketing spend linked from elsewhere"
      actions={
        canEditCosts && (
          <Button onClick={openAddModal}>
            + Record Costs
          </Button>
        )
      }
    >
      {/* Summary Card */}
      {sortedRows.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-apple-text-secondary">Monthly Baseline</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(baseline)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-apple-text-secondary">
                {getMonthName(latestRow.month - 1)} {latestRow.year} Total
              </p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(latestTotal)}</p>
            </div>
          </div>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={sortedRows}
        loading={loading}
        emptyMessage="No cost records yet"
        actions={canEditCosts ? (row) => (
          <>
            <ActionButton variant="edit" onClick={() => openEditModal(row)} title="Edit">
              <EditIcon />
            </ActionButton>
            {canDeleteRecords && !row._virtual && (
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
              <div className="flex items-baseline justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Fixed Costs</h4>
                <span className="text-xs text-apple-text-secondary">Auto-filled from configuration — edit to override</span>
              </div>
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

          {/* Linked Marketing Costs (read-only) */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Marketing Costs (linked)</h4>
              <span className="text-xs text-apple-text-secondary">
                Pulled automatically from Campaigns & Social Media
              </span>
            </div>
            {linkedForForm.length > 0 ? (
              <div className="space-y-2 bg-apple-bg rounded-apple-sm p-3">
                {linkedForForm.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">{cost.category}</Badge>
                      <span className="text-gray-700">{cost.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cost.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-apple-border-light">
                  <span className="text-sm font-medium">Marketing subtotal</span>
                  <span className="text-sm font-semibold">{formatCurrency(linkedFormTotal)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-apple-text-secondary">No marketing spend recorded for this period.</p>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-apple-border-light space-y-2">
            <div className="flex items-center justify-between text-sm text-apple-text-secondary">
              <span>Manual total</span>
              <span>{formatCurrency(manualTotal())}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-apple-text-secondary">
              <span>Linked marketing</span>
              <span>{formatCurrency(linkedFormTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-apple-blue">
                {formatCurrency(manualTotal() + linkedFormTotal)}
              </span>
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
