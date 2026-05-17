import { useAuth } from '../../contexts/AuthContext'
import { RoleBadge } from '../ui/Badge'
import { useState } from 'react'

export function Navbar() {
  const { currentUser, userData, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-apple-border-light z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Breadcrumb or Page Title */}
        <div>
          {/* Could add breadcrumbs here */}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-apple-bg transition-colors"
          >
            <div className="w-8 h-8 bg-apple-blue rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userData?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {userData?.name || currentUser?.email}
              </p>
              <div className="flex items-center gap-2">
                <RoleBadge role={userData?.role} />
              </div>
            </div>
            <svg className="w-4 h-4 text-apple-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-apple-sm shadow-apple-hover border border-apple-border-light py-2">
                <div className="px-4 py-2 border-b border-apple-border-light">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userData?.name || 'User'}
                  </p>
                  <p className="text-xs text-apple-text-secondary truncate">
                    {currentUser?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-apple-red hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
