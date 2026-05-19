import { createContext, useContext, type ReactNode } from 'react'

export type HeaderContextType = {
  actions: ReactNode | null
  setActions: (node: ReactNode | null) => void
}

export type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const HeaderContext = createContext<HeaderContextType | null>(null)
export const SidebarContext = createContext<SidebarContextType | null>(null)

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
