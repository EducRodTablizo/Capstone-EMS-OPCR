import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import type { TransactionStatus, DocumentaryStatus, SlaStatus } from '@/types'
import { cn } from '@/utils/cn'

interface StatusBadgeProps {
  status: TransactionStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'rgba(186, 117, 23, 0.3)' },
    },
    in_progress: {
      label: 'In Progress',
      icon: PlayCircle,
      style: { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#2563eb' },
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)' },
    },
  }[status]

  const Icon = config.icon
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border', className)}
      style={config.style}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

interface DocumentaryBadgeProps {
  status: DocumentaryStatus
  className?: string
}

export function DocumentaryBadge({ status, className }: DocumentaryBadgeProps) {
  const config = {
    complete: {
      label: 'Complete',
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)' }
    },
    incomplete: {
      label: 'Incomplete',
      style: { backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderColor: 'rgba(226, 75, 74, 0.3)' }
    },
    for_compliance: {
      label: 'For Compliance',
      style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'rgba(186, 117, 23, 0.3)' }
    },
  }[status]

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border', className)}
      style={config.style}
    >
      {config.label}
    </span>
  )
}

interface SLABadgeProps {
  status: SlaStatus
  isBreached?: boolean
  className?: string
}

export function SLABadge({ status, isBreached, className }: SLABadgeProps) {
  const config = {
    compliant: {
      label: 'Compliant',
      style: { backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(29, 158, 117, 0.3)' }
    },
    non_compliant: {
      label: 'Non-Compliant',
      style: { backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderColor: 'rgba(226, 75, 74, 0.3)' }
    },
    pending_computation: {
      label: 'Pending',
      style: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
    },
  }[status]

  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border', isBreached && 'animate-pulse-soft', className)}
      style={config.style}
    >
      {isBreached && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--error)' }} />}
      {config.label}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; style: React.CSSProperties }> = {
    subsystem_admin: {
      label: 'Subsystem Admin',
      style: { backgroundColor: 'rgba(88, 0, 0, 0.08)', color: 'var(--pup-primary)', borderColor: 'rgba(88, 0, 0, 0.2)' }
    },
    staff: {
      label: 'Staff',
      style: { backgroundColor: 'rgba(200, 150, 12, 0.12)', color: 'var(--pup-gold)', borderColor: 'rgba(200, 150, 12, 0.3)' }
    },
    opcr_evaluator: {
      label: 'OPCR Evaluator',
      style: { backgroundColor: 'rgba(27, 58, 107, 0.08)', color: 'var(--info)', borderColor: 'rgba(27, 58, 107, 0.2)' }
    },
  }
  const c = config[role] ?? {
    label: role,
    style: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
      style={c.style}
    >
      {c.label}
    </span>
  )
}
