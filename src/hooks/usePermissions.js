import { useAuth } from '../contexts/AuthContext'

export function usePermissions() {
  const { userRole, isAdmin, isManager } = useAuth()

  return {
    // Role checks
    isAdmin,
    isManager,
    isViewer: userRole === 'viewer',

    // Permission checks
    canViewDashboard: true, // All roles can view dashboard
    canViewBackendPanel: isManager, // Manager and Admin
    canManageUsers: isAdmin, // Admin only
    canEditConfig: isManager, // Manager and Admin
    canEditSales: isManager, // Manager and Admin
    canEditMarketing: isManager, // Manager and Admin
    canEditCosts: isManager, // Manager and Admin
    canConnectSocialAPIs: isAdmin, // Admin only
    canDeleteRecords: isManager, // Manager and Admin
    canSeedData: isAdmin, // Admin only (dev mode)

    // Helper function
    hasRole: (requiredRoles) => requiredRoles.includes(userRole),
  }
}
