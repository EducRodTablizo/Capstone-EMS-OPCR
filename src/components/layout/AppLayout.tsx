import { createContext, useContext, useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'

interface SidebarContextType {
  isCollapsed: boolean
  setCollapsed: (v: boolean) => void
  isMobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within AppLayout')
  }
  return context
}

export function AppLayout() {
  const [isCollapsed, setCollapsed] = useState(false)
  const [isMobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        setMobileOpen(false) // Close drawer when switching to mobile
      } else if (w < 1024) {
        setCollapsed(true)  // Collapse on tablet
      } else {
        setCollapsed(false) // Expand on desktop
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMobileOpen, setMobileOpen }}>
      <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Backdrop for mobile drawer */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
          <main className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarContext.Provider>
  )
}
