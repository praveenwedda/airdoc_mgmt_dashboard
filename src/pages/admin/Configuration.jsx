import { useState, useEffect } from 'react'
import { PageWrapper, PageSection } from '../../components/layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon, DeleteIcon } from '../../components/tables/DataTable'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { useDocument } from '../../hooks/useFirestore'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { formatCurrency, getMonthName } from '../../utils/formatters'

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i),
}))

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: currentYear - 1 + i,
  label: (currentYear - 1 + i).toString(),
}))

const PERIOD_TYPE_OPTIONS = [
  { value: 'all', label: 'All Months (Default)' },
  { value: 'specific', label: 'Specific Month' },
  { value: 'range', label: 'Date Range' },
]

export function Configuration() {
  const { document: config, loading } = useDocument('config', 'app')
  const [appName, setAppName] = useState('')
  const [packages, setPackages] = useState([])
  const [fixedCosts, setFixedCosts] = useState([])
  const [variableCosts, setVariableCosts] = useState([])
  const [monthlyTargets, setMonthlyTargets] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Modal state for targets
  const [showTargetModal, setShowTargetModal] = useState(false)
  const [editingTarget, setEditingTarget] = useState(null)
  const [showDeleteTargetModal, setShowDeleteTargetModal] = useState(false)
  const [targetToDelete, setTargetToDelete] = useState(null)

  const [targetFormData, setTargetFormData] = useState({
    periodType: 'all',
    startMonth: new Date().getMonth() + 1,
    startYear: currentYear,
    endMonth: new Date().getMonth() + 1,
    endYear: currentYear,
    mrrTarget: 0,
    expenditureBaseline: 0,
    packageTargets: [],
  })

  useEffect(() => {
    if (config) {
      setAppName(config.appName || 'AirDoc')
      setPackages(config.packages || [])
      setFixedCosts(config.fixedCosts || [])
      setVariableCosts(config.variableCosts || [])
      setMonthlyTargets(config.monthlyTargets || [])
    }
  }, [config])

  // Initialize package targets when packages change
  useEffect(() => {
    if (packages.length > 0 && targetFormData.packageTargets.length === 0) {
      setTargetFormData(prev => ({
        ...prev,
        packageTargets: packages.filter(p => p.active).map(p => ({
          packageId: p.id,
          packageName: p.name,
          target: 0,
        })),
      }))
    }
  }, [packages])

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })

      await setDoc(doc(db, 'config', 'app'), {
        appName,
        packages,
        fixedCosts,
        variableCosts,
        monthlyTargets,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      setMessage({ type: 'success', text: 'Configuration saved successfully!' })
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const addPackage = () => {
    setPackages([...packages, { id: Date.now().toString(), name: '', monthlyPrice: 0, description: '', active: true }])
  }

  const updatePackage = (index, field, value) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const removePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index))
  }

  const addFixedCost = () => {
    setFixedCosts([...fixedCosts, { name: '', monthlyAmount: 0 }])
  }

  const updateFixedCost = (index, field, value) => {
    const updated = [...fixedCosts]
    updated[index] = { ...updated[index], [field]: value }
    setFixedCosts(updated)
  }

  const removeFixedCost = (index) => {
    setFixedCosts(fixedCosts.filter((_, i) => i !== index))
  }

  const addVariableCost = () => {
    setVariableCosts([...variableCosts, { name: '', unitDriver: '', unitCost: 0 }])
  }

  const updateVariableCost = (index, field, value) => {
    const updated = [...variableCosts]
    updated[index] = { ...updated[index], [field]: value }
    setVariableCosts(updated)
  }

  const removeVariableCost = (index) => {
    setVariableCosts(variableCosts.filter((_, i) => i !== index))
  }

  // Target modal functions
  const openAddTargetModal = () => {
    setEditingTarget(null)
    setTargetFormData({
      periodType: 'all',
      startMonth: new Date().getMonth() + 1,
      startYear: currentYear,
      endMonth: new Date().getMonth() + 1,
      endYear: currentYear,
      mrrTarget: 0,
      expenditureBaseline: 0,
      packageTargets: packages.filter(p => p.active).map(p => ({
        packageId: p.id,
        packageName: p.name,
        target: 0,
      })),
    })
    setShowTargetModal(true)
  }

  const openEditTargetModal = (target, index) => {
    setEditingTarget(index)
    setTargetFormData({
      ...target,
      packageTargets: target.packageTargets || packages.filter(p => p.active).map(p => ({
        packageId: p.id,
        packageName: p.name,
        target: 0,
      })),
    })
    setShowTargetModal(true)
  }

  const updatePackageTarget = (packageId, value) => {
    setTargetFormData(prev => ({
      ...prev,
      packageTargets: prev.packageTargets.map(pt =>
        pt.packageId === packageId ? { ...pt, target: parseInt(value) || 0 } : pt
      ),
    }))
  }

  const handleSaveTarget = () => {
    const newTarget = {
      id: editingTarget !== null ? monthlyTargets[editingTarget].id : Date.now().toString(),
      ...targetFormData,
    }

    if (editingTarget !== null) {
      const updated = [...monthlyTargets]
      updated[editingTarget] = newTarget
      setMonthlyTargets(updated)
    } else {
      setMonthlyTargets([...monthlyTargets, newTarget])
    }
    setShowTargetModal(false)
  }

  const handleDeleteTarget = () => {
    if (targetToDelete !== null) {
      setMonthlyTargets(monthlyTargets.filter((_, i) => i !== targetToDelete))
      setShowDeleteTargetModal(false)
      setTargetToDelete(null)
    }
  }

  const formatTargetPeriod = (target) => {
    if (target.periodType === 'all') {
      return 'All Months'
    } else if (target.periodType === 'specific') {
      return `${getMonthName(target.startMonth - 1)} ${target.startYear}`
    } else {
      return `${getMonthName(target.startMonth - 1)} ${target.startYear} - ${getMonthName(target.endMonth - 1)} ${target.endYear}`
    }
  }

  const getTotalCustomerTarget = (target) => {
    return (target.packageTargets || []).reduce((sum, pt) => sum + (pt.target || 0), 0)
  }

  const targetColumns = [
    {
      key: 'period',
      header: 'Period',
      render: (_, row) => (
        <div>
          <span className="font-medium">{formatTargetPeriod(row)}</span>
          {row.periodType === 'all' && (
            <Badge variant="primary" className="ml-2">Default</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'mrrTarget',
      header: 'MRR Target',
      render: (val) => formatCurrency(val || 0),
    },
    {
      key: 'expenditureBaseline',
      header: 'Expenditure Baseline',
      render: (val) => formatCurrency(val || 0),
    },
    {
      key: 'customerTargets',
      header: 'New Customer Targets',
      render: (_, row) => {
        const total = getTotalCustomerTarget(row)
        return (
          <div>
            <span className="font-medium">{total} total</span>
            {row.packageTargets && row.packageTargets.length > 0 && (
              <div className="text-xs text-apple-text-secondary mt-1">
                {row.packageTargets.map(pt => `${pt.packageName}: ${pt.target}`).join(', ')}
              </div>
            )}
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <PageWrapper title="Configuration" subtitle="Manage app settings and pricing">
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Configuration"
      subtitle="Manage app settings and pricing"
      actions={
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      }
    >
      {message.text && (
        <div className={`mb-6 p-4 rounded-[12px] ${message.type === 'success' ? 'bg-green-50 text-[#34C759]' : 'bg-red-50 text-[#FF3B30]'}`}>
          {message.text}
        </div>
      )}

      {/* App Settings */}
      <PageSection title="App Settings">
        <Card>
          <div className="max-w-md">
            <Input
              label="Product Name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g., AirDoc"
            />
          </div>
        </Card>
      </PageSection>

      {/* Packages */}
      <PageSection
        title="Packages"
        actions={
          <Button variant="secondary" size="sm" onClick={addPackage}>
            + Add Package
          </Button>
        }
      >
        <Card>
          {packages.length === 0 ? (
            <p className="text-[#6E6E73] text-sm">No packages configured. Add your first package.</p>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg, index) => (
                <div key={pkg.id || index} className="flex items-start gap-4 p-4 bg-[#F5F5F7] rounded-[12px]">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Package Name"
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, 'name', e.target.value)}
                      placeholder="e.g., Starter"
                    />
                    <Input
                      label="Monthly Price (A$)"
                      type="number"
                      value={pkg.monthlyPrice}
                      onChange={(e) => updatePackage(index, 'monthlyPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <Input
                      label="Description"
                      value={pkg.description || ''}
                      onChange={(e) => updatePackage(index, 'description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={pkg.active}
                        onChange={(e) => updatePackage(index, 'active', e.target.checked)}
                        className="rounded text-[#0071E3] focus:ring-[#0071E3]"
                      />
                      Active
                    </label>
                    <button
                      onClick={() => removePackage(index)}
                      className="p-2 text-[#FF3B30] hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageSection>

      {/* Fixed Costs */}
      <PageSection
        title="Fixed Costs"
        actions={
          <Button variant="secondary" size="sm" onClick={addFixedCost}>
            + Add Fixed Cost
          </Button>
        }
      >
        <Card>
          {fixedCosts.length === 0 ? (
            <p className="text-[#6E6E73] text-sm">No fixed costs configured.</p>
          ) : (
            <div className="space-y-4">
              {fixedCosts.map((cost, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Cost Name"
                      value={cost.name}
                      onChange={(e) => updateFixedCost(index, 'name', e.target.value)}
                      placeholder="e.g., Server hosting"
                    />
                    <Input
                      label="Monthly Amount (A$)"
                      type="number"
                      value={cost.monthlyAmount}
                      onChange={(e) => updateFixedCost(index, 'monthlyAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <button
                    onClick={() => removeFixedCost(index)}
                    className="p-2 text-[#FF3B30] hover:bg-red-50 rounded-lg mb-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageSection>

      {/* Variable Costs */}
      <PageSection
        title="Variable Costs"
        actions={
          <Button variant="secondary" size="sm" onClick={addVariableCost}>
            + Add Variable Cost
          </Button>
        }
      >
        <Card>
          {variableCosts.length === 0 ? (
            <p className="text-[#6E6E73] text-sm">No variable costs configured.</p>
          ) : (
            <div className="space-y-4">
              {variableCosts.map((cost, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Cost Name"
                      value={cost.name}
                      onChange={(e) => updateVariableCost(index, 'name', e.target.value)}
                      placeholder="e.g., SMS cost"
                    />
                    <Input
                      label="Unit Driver"
                      value={cost.unitDriver}
                      onChange={(e) => updateVariableCost(index, 'unitDriver', e.target.value)}
                      placeholder="e.g., per SMS sent"
                    />
                    <Input
                      label="Unit Cost (A$)"
                      type="number"
                      step="0.01"
                      value={cost.unitCost}
                      onChange={(e) => updateVariableCost(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={() => removeVariableCost(index)}
                    className="p-2 text-[#FF3B30] hover:bg-red-50 rounded-lg mb-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageSection>

      {/* Baselines & Targets */}
      <PageSection
        title="Baselines & Targets"
        actions={
          <Button variant="secondary" size="sm" onClick={openAddTargetModal}>
            + Add Target
          </Button>
        }
      >
        <Card padding={false}>
          {monthlyTargets.length === 0 ? (
            <div className="p-6">
              <p className="text-[#6E6E73] text-sm">No targets configured. Add your first target to set MRR goals and customer acquisition targets.</p>
            </div>
          ) : (
            <DataTable
              columns={targetColumns}
              data={monthlyTargets}
              actions={(row) => {
                const index = monthlyTargets.findIndex(t => t.id === row.id)
                return (
                  <>
                    <ActionButton variant="edit" onClick={() => openEditTargetModal(row, index)} title="Edit">
                      <EditIcon />
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => {
                        setTargetToDelete(index)
                        setShowDeleteTargetModal(true)
                      }}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </ActionButton>
                  </>
                )
              }}
            />
          )}
        </Card>
      </PageSection>

      {/* Add/Edit Target Modal */}
      <Modal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        title={editingTarget !== null ? 'Edit Target' : 'Add Target'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Period Type */}
          <Select
            label="Apply To"
            value={targetFormData.periodType}
            onChange={(e) => setTargetFormData({ ...targetFormData, periodType: e.target.value })}
            options={PERIOD_TYPE_OPTIONS}
          />

          {/* Specific Month */}
          {targetFormData.periodType === 'specific' && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Month"
                value={targetFormData.startMonth}
                onChange={(e) => setTargetFormData({ ...targetFormData, startMonth: parseInt(e.target.value) })}
                options={MONTH_OPTIONS}
              />
              <Select
                label="Year"
                value={targetFormData.startYear}
                onChange={(e) => setTargetFormData({ ...targetFormData, startYear: parseInt(e.target.value) })}
                options={YEAR_OPTIONS}
              />
            </div>
          )}

          {/* Date Range */}
          {targetFormData.periodType === 'range' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Start Month"
                  value={targetFormData.startMonth}
                  onChange={(e) => setTargetFormData({ ...targetFormData, startMonth: parseInt(e.target.value) })}
                  options={MONTH_OPTIONS}
                />
                <Select
                  label="Start Year"
                  value={targetFormData.startYear}
                  onChange={(e) => setTargetFormData({ ...targetFormData, startYear: parseInt(e.target.value) })}
                  options={YEAR_OPTIONS}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="End Month"
                  value={targetFormData.endMonth}
                  onChange={(e) => setTargetFormData({ ...targetFormData, endMonth: parseInt(e.target.value) })}
                  options={MONTH_OPTIONS}
                />
                <Select
                  label="End Year"
                  value={targetFormData.endYear}
                  onChange={(e) => setTargetFormData({ ...targetFormData, endYear: parseInt(e.target.value) })}
                  options={YEAR_OPTIONS}
                />
              </div>
            </>
          )}

          {/* Financial Targets */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="MRR Target (A$)"
              type="number"
              value={targetFormData.mrrTarget}
              onChange={(e) => setTargetFormData({ ...targetFormData, mrrTarget: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Expenditure Baseline (A$)"
              type="number"
              value={targetFormData.expenditureBaseline}
              onChange={(e) => setTargetFormData({ ...targetFormData, expenditureBaseline: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          {/* Per-Package Customer Targets */}
          <div>
            <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wide mb-3">
              New Customer Targets (per package)
            </label>
            {targetFormData.packageTargets.length === 0 ? (
              <p className="text-sm text-[#6E6E73]">No active packages. Add packages first.</p>
            ) : (
              <div className="space-y-3">
                {targetFormData.packageTargets.map((pt) => (
                  <div key={pt.packageId} className="flex items-center gap-4 p-3 bg-[#F5F5F7] rounded-[12px]">
                    <span className="flex-1 text-sm font-medium">{pt.packageName}</span>
                    <Input
                      type="number"
                      min="0"
                      value={pt.target}
                      onChange={(e) => updatePackageTarget(pt.packageId, e.target.value)}
                      placeholder="0"
                      className="w-24"
                    />
                    <span className="text-sm text-[#6E6E73]">customers</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                  <span className="text-sm font-medium">Total Target</span>
                  <span className="text-sm font-semibold text-[#0071E3]">
                    {targetFormData.packageTargets.reduce((sum, pt) => sum + (pt.target || 0), 0)} customers
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowTargetModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTarget}>
              {editingTarget !== null ? 'Update' : 'Add'} Target
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Target Confirmation */}
      <ConfirmModal
        isOpen={showDeleteTargetModal}
        onClose={() => setShowDeleteTargetModal(false)}
        onConfirm={handleDeleteTarget}
        title="Delete Target"
        message="Are you sure you want to delete this target? This action cannot be undone."
        confirmText="Delete"
      />
    </PageWrapper>
  )
}
