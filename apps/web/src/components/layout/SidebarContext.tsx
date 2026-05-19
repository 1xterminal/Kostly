import { useState, type ReactNode } from 'react'
import { HeaderContext, SidebarContext } from './sidebar-context'

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
