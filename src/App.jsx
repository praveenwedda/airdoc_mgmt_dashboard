import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { usePermissions } from './hooks/usePermissions'

// Auth Pages
import { Login } from './pages/auth/Login'

// Dashboard Pages
import { Overview } from './pages/dashboard/Overview'
import { Revenue } from './pages/dashboard/Revenue'
import { Customers } from './pages/dashboard/Customers'
import { MarketingSummary } from './pages/dashboard/Marketing'
import { CostAnalysis } from './pages/dashboard/Costs'

// Admin Pages
import { Configuration } from './pages/admin/Configuration'
import { Acquisitions } from './pages/admin/Acquisitions'
import { Churn } from './pages/admin/Churn'
import { Costs } from './pages/admin/Costs'
import { Meetings } from './pages/admin/Meetings'
import { Campaigns } from './pages/admin/Campaigns'
import { SocialMedia } from './pages/admin/SocialMedia'
import { Users } from './pages/admin/Users'
import { Integrations } from './pages/admin/Integrations'

// Protected Route wrapper
function ProtectedRoute({ children, requireManager = false, requireAdmin = false }) {
  const { currentUser, loading } = useAuth()
  const { isManager, isAdmin } = usePermissions()

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-apple-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (requireManager && !isManager) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route wrapper (redirect if already logged in)
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-apple-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Dashboard Routes (All authenticated users) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Overview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/revenue"
        element={
          <ProtectedRoute>
            <Revenue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/marketing"
        element={
          <ProtectedRoute>
            <MarketingSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/costs"
        element={
          <ProtectedRoute>
            <CostAnalysis />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes (Manager + Admin) */}
      <Route
        path="/admin/config"
        element={
          <ProtectedRoute requireManager>
            <Configuration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales/acquisitions"
        element={
          <ProtectedRoute requireManager>
            <Acquisitions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sales/churn"
        element={
          <ProtectedRoute requireManager>
            <Churn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/costs"
        element={
          <ProtectedRoute requireManager>
            <Costs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/marketing/meetings"
        element={
          <ProtectedRoute requireManager>
            <Meetings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/marketing/campaigns"
        element={
          <ProtectedRoute requireManager>
            <Campaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/marketing/social"
        element={
          <ProtectedRoute requireManager>
            <SocialMedia />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/integrations"
        element={
          <ProtectedRoute requireAdmin>
            <Integrations />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
