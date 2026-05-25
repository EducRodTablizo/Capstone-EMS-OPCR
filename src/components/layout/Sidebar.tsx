import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Clock, LogOut,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['subsystem_admin', 'staff', 'opcr_evaluator'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['subsystem_admin', 'opcr_evaluator'] },
  { to: '/transactions', label: 'Transactions', icon: ClipboardList, roles: ['subsystem_admin', 'staff', 'opcr_evaluator'] },
  { to: '/sla-review', label: 'SLA Review', icon: Clock, roles: ['subsystem_admin', 'opcr_evaluator'] },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  const visible = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100017370/757bc6c1-305f-4e.png"
            alt="PUP Logo"
            className="w-9 h-9 rounded-full object-contain bg-white shrink-0"
            crossOrigin="anonymous"
          />
          <div>
            <p className="text-sidebar-foreground font-bold text-sm leading-tight">EMS</p>
            <p className="text-sidebar-foreground/60 text-[10px] leading-tight">PUP Caloocan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-bold shrink-0">
            {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">{user?.name}</p>
            <p className="text-sidebar-foreground/50 text-[10px] truncate">{user?.office_name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
