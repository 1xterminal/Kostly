import { NavLink } from 'react-router'
import { useSession, useSignOut } from '@/hooks/useAuth'
import { Symbols } from '../MaterialSymbols'
import Avatar from '../Avatar'

// ─── Nav Items Config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    to: '/dashboard',
    end: true,
    label: 'Dashboard',
    icon: <Symbols iconName="dashboard"/>,
  },
  {
    to: '/dashboard/rooms',
    label: 'Room Inventory',
    icon: <Symbols iconName="nest_multi_room"/>,
  },
  {
    to: '/dashboard/tenants',
    label: 'Tenants',
    icon: <Symbols iconName="group"/>,
  },
  {
    to: '/dashboard/payments',
    label: 'Payments',
    icon: <Symbols iconName="account_balance_wallet"/>,
  },
  {
    to: '/dashboard/maintenance',
    label: 'Maintenance Center',
    icon: <Symbols iconName="build"/>,
  },
  {
    to: '/dashboard/reports',
    label: 'Reports',
    icon: <Symbols iconName="assignment"/>,
  },
  {
    to: '/dashboard/profile',
    label: 'Profile',
    icon: <Symbols iconName="account_circle"/>,
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
        borderRadius: 20,
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
      <div style={{
        backgroundColor: '#F3F4F6',
        borderBottom: '1px solid #D1D5DB',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Profile picture */}
        {/* <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#D1D5DB', marginBottom: 16 }} /> */}
        <Avatar/>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: '#111827', letterSpacing: '-2%' }}>
            Welcome, {userName}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.25, color: '#6B7280' }}>Manager</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) =>({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 46,
              paddingInline: 12,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 6,
              outline: '0px solid',
              transition: 'all 0.2s easeOut',
              ...(isActive
                ? {
                    backgroundColor: '#ffffff',
                    color: '#3045AF',
                    outlineColor: 'rgba(48,69,175,1)',
                    outlineWidth: 2
                  }
                : {
                    color: '#111827',
                    outlineColor: 'transparent',
                    backgroundColor: 'transparent',
                    outlineWidth: 0
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
      <div style={{ padding: '0 12px 12px', marginTop: 'auto' }}>
        <button
          onClick={() => signOut()}
          disabled={isPending}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            paddingInline: 12,
            height: 46,
            fontSize: 16,
            fontWeight: 600,
            color: '#6B7280',
            background: 'none',
            outline: '0px solid transparent',
            borderRadius: 6,
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s easeOut',
            fontFamily: 'inherit',
            opacity: isPending ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#DC2626'
            e.currentTarget.style.backgroundColor = '#FEF2F2'
            e.currentTarget.style.outlineWidth = '2px'
            e.currentTarget.style.outlineColor = '#FECACA'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#6B7280'
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.outlineWidth = '0px'
            e.currentTarget.style.outlineColor = 'transparent'
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
