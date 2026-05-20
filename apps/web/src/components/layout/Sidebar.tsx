import { NavLink } from 'react-router'
import { useSession, useSignOut } from '@/hooks/useAuth'

// ─── Nav Items Config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    to: '/dashboard',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/rooms',
    label: 'Room Inventory',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/dashboard/tenants',
    label: 'Tenants',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/payments',
    label: 'Payments',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/maintenance',
    label: 'Maintenance Center',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/reports',
    label: 'Reports',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/profile',
    label: 'Profile',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { data: session } = useSession()
  const { mutate: signOut, isPending } = useSignOut()
  const userName = session?.user?.user_metadata?.full_name ?? session?.user?.email ?? 'Manager'

  return (
    <aside
      style={{
        width: 300,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        maxHeight: '100%',
      }}
    >
      {/* Profile Section */}
      <div style={{ backgroundColor: '#F3F4F6', borderBottom: '1px solid #D1D5DB', padding: '32px 24px 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#D1D5DB', marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 600, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Welcome, {userName}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#6B7280' }}>Manager</div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
      {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) =>({
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 16px',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid',
              transition: 'all 0.2s ease',
              ...(isActive
                ? {
                    backgroundColor: '#ffffff',
                    color: '#3045AF',
                    borderColor: 'rgba(48,69,175,0.5)',
                  }
                : {
                    color: '#111827',
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                  }),
            })}
          >
            <span style={{ width: 22, height: 22, flexShrink: 0, display: 'flex' }}>
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out — pinned to bottom */}
      <div style={{ padding: '0 16px 20px', marginTop: 'auto' }}>
        <button
          onClick={() => signOut()}
          disabled={isPending}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '12px 16px',
            fontSize: 16,
            fontWeight: 600,
            color: '#6B7280',
            background: 'none',
            border: '1px solid transparent',
            borderRadius: 6,
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            opacity: isPending ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#DC2626'
            e.currentTarget.style.backgroundColor = '#FEF2F2'
            e.currentTarget.style.borderColor = '#FECACA'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#6B7280'
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <span style={{ width: 22, height: 22, flexShrink: 0, display: 'flex' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          {isPending ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
