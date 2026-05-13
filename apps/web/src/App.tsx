/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import { createBrowserRouter, redirect } from 'react-router'
import { supabase } from './lib/supabase'
import DashboardLayout from './components/layout/DashboardLayout'
import { PageWrapper } from './components/ui/ErrorBoundary'
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

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each route chunk is downloaded only when first visited.
// PageWrapper provides Suspense skeleton + ErrorBoundary for each page.

const _Placeholder = ({ name }: { name: string }) => (
  <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
    <h2>{name}</h2>
    <p>This page is not built yet.</p>
  </div>
)

// Swap each lazy() import with the real page as your team builds them:
const Overview      = () => <PageWrapper><_Placeholder name="Overview" /></PageWrapper>
const Rooms         = () => <PageWrapper><_Placeholder name="Rooms" /></PageWrapper>
const TenantsPage   = lazy(() => import('./pages/dashboard/Tenants'))
const Tenants       = () => <PageWrapper><TenantsPage /></PageWrapper>
const Payments      = () => <PageWrapper><_Placeholder name="Payments" /></PageWrapper>
const Tickets       = () => <PageWrapper><_Placeholder name="Maintenance" /></PageWrapper>
const Reports       = () => <PageWrapper><_Placeholder name="Reports" /></PageWrapper>
const ReportDetails = () => <PageWrapper><_Placeholder name="Report Details" /></PageWrapper>
const Profile       = () => <PageWrapper><_Placeholder name="Profile" /></PageWrapper>

// Example of how to swap in a real page (uncomment when ready):
// const Overview = lazy(() => import('./pages/dashboard/Overview'))

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
