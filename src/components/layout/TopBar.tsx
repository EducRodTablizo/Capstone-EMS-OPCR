import { Bell } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { RoleBadge } from '@/components/shared/StatusBadge'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        {user && <RoleBadge role={user.role} />}
      </div>
    </header>
  )
}
