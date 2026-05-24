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
      className: 'bg-warning/10 text-warning border border-warning/30',
    },
    in_progress: {
      label: 'In Progress',
      icon: PlayCircle,
      className: 'bg-info/10 text-info border border-info/30',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-success/10 text-success border border-success/30',
    },
  }[status]

  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className, className)}>
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
    complete: { label: 'Complete', className: 'bg-success/10 text-success border border-success/30' },
    incomplete: { label: 'Incomplete', className: 'bg-destructive/10 text-destructive border border-destructive/30' },
    for_compliance: { label: 'For Compliance', className: 'bg-warning/10 text-warning border border-warning/30' },
  }[status]

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className, className)}>
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
    compliant: { label: 'Compliant', className: 'bg-success/10 text-success border border-success/30' },
    non_compliant: { label: 'Non-Compliant', className: 'bg-destructive/10 text-destructive border border-destructive/30' },
    pending_computation: { label: 'Pending', className: 'bg-muted text-muted-foreground border border-border' },
  }[status]

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className, isBreached && 'animate-pulse-soft', className)}>
      {isBreached && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
      {config.label}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    subsystem_admin: { label: 'Subsystem Admin', className: 'bg-primary/10 text-primary border border-primary/20' },
    staff: { label: 'Staff', className: 'bg-secondary/20 text-secondary-foreground border border-secondary/30' },
    opcr_evaluator: { label: 'OPCR Evaluator', className: 'bg-info/10 text-info border border-info/20' },
  }
  const c = config[role] ?? { label: role, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', c.className)}>
      {c.label}
    </span>
  )
}
