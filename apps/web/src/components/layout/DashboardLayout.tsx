import { Outlet } from 'react-router'
import { SidebarProvider, useSidebar } from './SidebarContext'
import Sidebar from './Sidebar'

function Layout() {
  const { isOpen, close } = useSidebar()

  return (
    <div className="flex h-screen bg-[#F0F0F0]">
      {/* Sidebar drawer — slides in when isOpen = true */}
      {isOpen && (
        <>
          {/* Overlay: click outside to close */}
          <div
            className="fixed inset-0 bg-black/20 z-10"
            onClick={close}
          />
          <Sidebar />
        </>
      )}

      {/* Main content — always full width */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Each page renders its own header (title + hamburger + action buttons) */}
        <Outlet />
      </main>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  )
}
