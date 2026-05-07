import { createBrowserRouter, redirect } from 'react-router'
import { supabase } from './lib/supabase'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// ─── Auth Guard ───────────────────────────────────────────────────────────────
// Runs before any /dashboard/* route renders.
// Redirects to /login if no session or role isn't 'owner'.
async function requireOwner() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return redirect('/login')

  const role = session.user.user_metadata?.role
  if (role !== 'owner') {
    await supabase.auth.signOut()
    return redirect('/login')
  }
  return null
}

// ─── Placeholder pages ────────────────────────────────────────────────────────
// Swap these out as each page gets built by the team.
const Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
    <h2>{name}</h2>
    <p>This page is not built yet.</p>
  </div>
)

const Overview     = () => <Placeholder name="Overview" />
const Rooms        = () => <Placeholder name="Rooms" />
const Tenants      = () => <Placeholder name="Tenants" />
const Payments     = () => <Placeholder name="Payments" />
const Tickets      = () => <Placeholder name="Maintenance" />
const Reports      = () => <Placeholder name="Reports" />
const ReportDetails = () => <Placeholder name="Report Details" />
const Profile      = () => <Placeholder name="Profile" />

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public
  { path: '/login',           element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password',  element: <ResetPassword /> },

  // Protected — all under DashboardLayout
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    loader: requireOwner,
    children: [
      { index: true,                element: <Overview /> },
      { path: 'rooms',              element: <Rooms /> },
      { path: 'tenants',            element: <Tenants /> },
      { path: 'payments',           element: <Payments /> },
      { path: 'maintenance',        element: <Tickets /> },
      { path: 'reports',            element: <Reports /> },
      { path: 'reports/:monthYear', element: <ReportDetails /> },
      { path: 'profile',            element: <Profile /> },
    ],
  },

  // Catch-all
  { path: '*', loader: () => redirect('/login') },
])
