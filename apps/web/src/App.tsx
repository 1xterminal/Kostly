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

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error || profile?.role !== 'owner') {
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

const TenantsPage = lazy(() => import('./pages/dashboard/Tenants'))
const OverviewPage = lazy(() => import('./pages/dashboard/Overview'))
const RoomsPage = lazy(() => import('./pages/dashboard/Rooms'))
const PaymentsPage = lazy(() => import('./pages/dashboard/Payments'))
const TicketsPage = lazy(() => import('./pages/dashboard/Tickets'))
const ReportsPage = lazy(() => import('./pages/dashboard/reports/Reports'))
const ReportDetailsPage = lazy(() => import('./pages/dashboard/reports/ReportDetails'))

const Overview = () => <PageWrapper><OverviewPage /></PageWrapper>
const Rooms = () => <PageWrapper><RoomsPage /></PageWrapper>
const Tenants = () => <PageWrapper><TenantsPage /></PageWrapper>
const Payments = () => <PageWrapper><PaymentsPage /></PageWrapper>
const Tickets = () => <PageWrapper><TicketsPage /></PageWrapper>
const Reports = () => <PageWrapper><ReportsPage /></PageWrapper>
const ReportDetails = () => <PageWrapper><ReportDetailsPage /></PageWrapper>
const Profile = () => <PageWrapper><_Placeholder name="Profile" /></PageWrapper>

// Example of how to swap in a real page (uncomment when ready):
// const Overview = lazy(() => import('./pages/dashboard/Overview'))

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Protected — all under DashboardLayout
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    loader: requireOwner,
    HydrateFallback: () => null,
    children: [
      { index: true, element: <Overview /> },
      { path: 'rooms', element: <Rooms /> },
      { path: 'tenants', element: <Tenants /> },
      { path: 'payments', element: <Payments /> },
      { path: 'maintenance', element: <Tickets /> },
      { path: 'reports', element: <Reports /> },
      { path: 'reports/:reportId', element: <ReportDetails /> },
      { path: 'profile', element: <Profile /> },
    ],
  },

  // Catch-all
  { path: '*', loader: () => redirect('/login') },
])
