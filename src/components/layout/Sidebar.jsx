import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

const navItems = [
  {
    title: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    items: [
      { name: 'Overview', path: '/dashboard' },
      { name: 'Revenue', path: '/dashboard/revenue' },
      { name: 'Customers', path: '/dashboard/customers' },
      { name: 'Marketing Summary', path: '/dashboard/marketing' },
    ]
  },
  {
    title: 'Backend Panel',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    requiresManager: true,
    items: [
      { name: 'Configuration', path: '/admin/config' },
      {
        name: 'Sales',
        children: [
          { name: 'Acquisitions', path: '/admin/sales/acquisitions' },
          { name: 'Churn', path: '/admin/sales/churn' },
        ]
      },
      {
        name: 'Marketing',
        children: [
          { name: 'Meetings', path: '/admin/marketing/meetings' },
          { name: 'Campaigns', path: '/admin/marketing/campaigns' },
          { name: 'Social Media', path: '/admin/marketing/social' },
        ]
      },
      { name: 'Costs', path: '/admin/costs' },
    ]
  },
  {
    title: 'User Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    requiresAdmin: true,
    items: [
      { name: 'Users', path: '/admin/users' },
    ]
  },
  {
    title: 'Integrations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    requiresAdmin: true,
    items: [
      { name: 'Social Media Connections', path: '/admin/integrations' },
    ]
  },
]

function NavItem({ item, isChild = false }) {
  const baseClasses = isChild
    ? 'block py-2 px-4 text-sm rounded-lg transition-colors'
    : 'flex items-center gap-3 py-2.5 px-4 text-sm rounded-xl transition-colors'

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `${baseClasses} ${
          isActive
            ? 'bg-apple-active-bg text-apple-blue font-medium'
            : 'text-apple-text-secondary hover:bg-apple-bg hover:text-gray-900'
        }`
      }
    >
      {item.name}
    </NavLink>
  )
}

function NavGroup({ item }) {
  return (
    <div className="space-y-1">
      <span className="block py-2 px-4 text-sm text-apple-text-secondary">
        {item.name}
      </span>
      <div className="pl-4 space-y-0.5">
        {item.children.map((child) => (
          <NavItem key={child.path} item={child} isChild />
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { isAdmin, isManager } = usePermissions()

  const filteredNavItems = navItems.filter((section) => {
    if (section.requiresAdmin && !isAdmin) return false
    if (section.requiresManager && !isManager) return false
    return true
  })

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-apple-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-apple-border-light">
        <h1 className="text-2xl font-bold text-gray-900 tracking-heading">
          AirDoc
        </h1>
        <p className="text-xs text-apple-text-secondary mt-1">Operations Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredNavItems.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 px-4 mb-2">
              <span className="text-apple-text-secondary">{section.icon}</span>
              <span className="text-xs font-semibold text-apple-text-secondary uppercase tracking-wide">
                {section.title}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map((item) =>
                item.children ? (
                  <NavGroup key={item.name} item={item} />
                ) : (
                  <NavItem key={item.path} item={item} />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-apple-border-light">
        <p className="text-xs text-apple-text-secondary text-center">
          AirDoc v1.0
        </p>
      </div>
    </aside>
  )
}
