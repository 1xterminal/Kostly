import { createContext, useContext, useState } from 'react'

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)  // hidden by default

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggle: () => setIsOpen(o => !o),
      close: () => setIsOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Hook pages use to access sidebar state
export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider')
  return ctx
}
