import { useState } from 'react'
import { PageWrapper } from '../../components/layout'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { DataTable, ActionButton, EditIcon } from '../../components/tables/DataTable'
import { RoleBadge, Badge } from '../../components/ui/Badge'
import { useCollection, useFirestoreOperations } from '../../hooks/useFirestore'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate } from '../../utils/formatters'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../../services/firebase'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
]

export function Users() {
  const { documents: users, loading } = useCollection('users')
  const { currentUser, createUser } = useAuth()
  const { canManageUsers } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDeactivate, setUserToDeactivate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
  })

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (val) => <RoleBadge role={val} /> },
    {
      key: 'active',
      header: 'Status',
      render: (val) => val === false
        ? <Badge variant="danger">Inactive</Badge>
        : <Badge variant="success">Active</Badge>
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (val) => val?.toDate ? formatDate(val.toDate()) : formatDate(val)
    },
  ]

  const openAddModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'viewer',
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.role) {
      setError('Please fill in all required fields')
      return
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users')
      return
    }

    if (!editingUser && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)

      if (editingUser) {
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: formData.name,
          role: formData.role,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: true,
          createdAt: serverTimestamp(),
        })
      }

      setShowModal(false)
    } catch (err) {
      console.error('Error saving user:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak')
      } else {
        setError('Failed to save user. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!userToDeactivate) return

    try {
      setSaving(true)
      const newStatus = userToDeactivate.active === false ? true : false
      await updateDoc(doc(db, 'users', userToDeactivate.id), {
        active: newStatus,
        updatedAt: serverTimestamp(),
      })
      setShowDeactivateModal(false)
      setUserToDeactivate(null)
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    // Sort by createdAt descending
    const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
    const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
    return bDate - aDate
  })

  if (!canManageUsers) {
    return (
      <PageWrapper title="User Management">
        <div className="text-center py-12">
          <p className="text-apple-text-secondary">You do not have permission to access this page.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="User Management"
      subtitle="Manage user accounts and permissions"
      actions={
        <Button onClick={openAddModal}>
          + Create User
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={sortedUsers}
        loading={loading}
        emptyMessage="No users found"
        actions={(row) => (
          <>
            <ActionButton variant="edit" onClick={() => openEditModal(row)} title="Edit">
              <EditIcon />
            </ActionButton>
            {row.id !== currentUser?.uid && (
              <ActionButton
                variant={row.active === false ? 'edit' : 'delete'}
                onClick={() => {
                  setUserToDeactivate(row)
                  setShowDeactivateModal(true)
                }}
                title={row.active === false ? 'Activate' : 'Deactivate'}
              >
                {row.active === false ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </ActionButton>
            )}
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-apple-sm">
              <p className="text-sm text-apple-red">{error}</p>
            </div>
          )}

          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            disabled={!!editingUser}
            required
          />

          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          )}

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={ROLE_OPTIONS}
          />

          <div className="pt-2 space-y-2">
            <p className="text-xs text-apple-text-secondary font-medium">Role Permissions:</p>
            <ul className="text-xs text-apple-text-secondary space-y-1">
              <li><strong>Viewer:</strong> Read-only access to dashboard</li>
              <li><strong>Manager:</strong> Dashboard + data entry (no user management)</li>
              <li><strong>Admin:</strong> Full access including user management</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Confirmation */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivate}
        title={userToDeactivate?.active === false ? 'Activate User' : 'Deactivate User'}
        message={
          userToDeactivate?.active === false
            ? `Are you sure you want to reactivate ${userToDeactivate?.name}? They will be able to log in again.`
            : `Are you sure you want to deactivate ${userToDeactivate?.name}? They will no longer be able to log in.`
        }
        confirmText={userToDeactivate?.active === false ? 'Activate' : 'Deactivate'}
        variant={userToDeactivate?.active === false ? 'primary' : 'danger'}
        loading={saving}
      />
    </PageWrapper>
  )
}
