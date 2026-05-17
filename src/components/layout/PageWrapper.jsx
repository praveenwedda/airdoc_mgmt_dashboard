import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function PageWrapper({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-apple-bg">
      <Sidebar />
      <Navbar />

      <main className="pl-64 pt-16">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          {(title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                {title && (
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-heading">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-apple-text-secondary mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          )}

          {/* Page Content */}
          {children}
        </div>
      </main>
    </div>
  )
}

export function PageSection({ title, children, actions, className = '' }) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 tracking-heading">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
