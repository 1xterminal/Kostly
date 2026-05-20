import { Outlet, useLocation } from 'react-router'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import Sidebar from './Sidebar'
import { SidebarProvider } from './SidebarContext'
import { useSidebar, useSidebarHeader } from './sidebar-context'

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':             'Dashboard',
  '/dashboard/rooms':       'Room Inventory',
  '/dashboard/tenants':     'Tenants',
  '/dashboard/payments':    'Payments',
  '/dashboard/maintenance': 'Maintenance Center',
  '/dashboard/reports':     'Reports',
  '/dashboard/profile':     'Profile',
}

// ─── Inner layout ─────────────────────────────────────────────────────────────

function Layout() {
  const location = useLocation()
  const { isOpen, toggle } = useSidebar()
  const { actions } = useSidebarHeader()
  const title = PAGE_TITLES[location.pathname] ?? 'Dashboard'

  // AutoAnimate only where it makes sense — header action buttons
  const [actionsRef] = useAutoAnimate()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#EBEBEB',
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 32,
          width: '100%',
          maxWidth: 1400,
          minHeight: 'calc(100vh - 80px)',
          alignItems: 'flex-start',
        }}
      >
        {/*
          Sidebar — CSS transform slide (GPU-accelerated, smooth like Framer Motion).
          Always mounted so transition runs on both open AND close.
          translateX(-100%) slides it off-screen; opacity fades it out.
          The outer clip wrapper collapses width so it doesn't take up space when closed.
        */}
        <div
          style={{
            width: isOpen ? 300 : 0,
            flexShrink: 0,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              width: 300,
              transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
              opacity: isOpen ? 1 : 0,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
            }}
          >
            <Sidebar />
          </div>
        </div>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              paddingTop: 8,
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#111827',
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                margin: 0,
              }}
            >
              <button
                onClick={toggle}
                aria-label="Toggle sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#111827',
                  padding: 0,
                  opacity: 1,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.5')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {title}
            </h1>

            {/* AutoAnimate — action buttons animate when pages swap them */}
            <div ref={actionsRef} style={{ display: 'flex', gap: 16 }}>
              {actions}
            </div>
          </header>

          <div style={{ flex: 1 }}>
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  )
}
