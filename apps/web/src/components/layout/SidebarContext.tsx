import { createContext, useContext, useState, type ReactNode } from 'react'

// ─── Header actions context (for page-level buttons in the layout header) ─────

type HeaderContextType = {
  actions: ReactNode | null
  setActions: (node: ReactNode | null) => void
}

const HeaderContext = createContext<HeaderContextType | null>(null)

// ─── Sidebar context (kept for future mobile collapse) ────────────────────────

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)  // visible by default
  const [actions, setActions] = useState<ReactNode | null>(null)

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggle: () => setIsOpen(o => !o),
      close:  () => setIsOpen(false),
    }}>
      <HeaderContext.Provider value={{ actions, setActions }}>
        {children}
      </HeaderContext.Provider>
    </SidebarContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider')
  return ctx
}

export function useSidebarHeader() {
  const ctx = useContext(HeaderContext)
  if (!ctx) throw new Error('useSidebarHeader must be used inside SidebarProvider')
  return ctx
}
