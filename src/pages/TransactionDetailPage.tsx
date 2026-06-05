import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, User2, AlertTriangle, CheckCircle2,
  Lock, RotateCcw,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  getTransactionApi, getTransactionHistoryApi,
  updateTransactionStatusApi, updateDocumentaryStatusApi,
  assignTransactionApi, getUsersApi,
} from '@/api/mockApi'
import type { Transaction, TransactionStatusHistory, User, TransactionStatus, DocumentaryStatus } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { slaVariance } from '@/utils/slaUtils'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

const STATUS_FLOW: TransactionStatus[] = ['pending', 'in_progress', 'completed']

function StatusStep({ status, current, completed }: { status: TransactionStatus; current: TransactionStatus; completed: boolean }) {
  const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' }
  const isActive = status === current
  const isDone = completed || STATUS_FLOW.indexOf(status) < STATUS_FLOW.indexOf(current)
  return (
    <div className={cn('flex-1 text-center', isActive && 'font-medium')}>
      <div className={cn(
        'h-2 rounded-full mb-1.5 transition-colors',
        isDone ? 'bg-success' : isActive ? 'bg-primary' : 'bg-muted',
      )} />
      <span className={cn(
        'text-xs',
        isDone || isActive ? 'text-foreground' : 'text-muted-foreground',
      )}>
        {labels[status]}
      </span>
    </div>
  )
}

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [txn, setTxn] = useState<Transaction | null>(null)
  const [history, setHistory] = useState<TransactionStatusHistory[]>([])
  const [officeUsers, setOfficeUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [remarks, setRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  const canModify = user?.role !== 'opcr_evaluator' && txn?.status !== 'completed'

  useEffect(() => {
    if (!id) return
    Promise.all([
      getTransactionApi(id),
      getTransactionHistoryApi(id),
      getUsersApi(user?.office_id),
    ]).then(([t, h, users]) => {
      setTxn(t)
      setHistory(h)
      setOfficeUsers(users.filter((u) => u.role !== 'opcr_evaluator'))
    }).finally(() => setLoading(false))
  }, [id, user])

  async function handleStatusUpdate(newStatus: TransactionStatus) {
    if (!txn || !user) return
    setUpdating(true)
    try {
      const updated = await updateTransactionStatusApi(txn.id, { status: newStatus, remarks: remarks || undefined }, user)
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      setRemarks('')
      toast({ title: `Status → ${newStatus.replace('_', ' ')}`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  async function handleDocStatusUpdate(newStatus: DocumentaryStatus) {
    if (!txn || !user) return
    setUpdating(true)
    try {
      const updated = await updateDocumentaryStatusApi(txn.id, { documentary_status: newStatus }, user)
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      toast({ title: `Documentary status updated`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  async function handleAssign(userId: string) {
    if (!txn || !user) return
    setUpdating(true)
    try {
      const updated = await assignTransactionApi(txn.id, userId, user)
      setTxn(updated)
      toast({ title: 'Assigned successfully', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!txn) return <div className="p-6 text-muted-foreground">Transaction not found.</div>

  const nextStatus: TransactionStatus | null = txn.status === 'pending'
    ? 'in_progress'
    : txn.status === 'in_progress'
    ? 'completed'
    : null

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Transaction Detail" subtitle={`ID: ${txn.id}`} />

      <div className="flex-1 p-6 overflow-auto">
        <Link to="/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Link>

        {/* Completed read-only notice */}
        {txn.status === 'completed' && (
          <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 px-4 py-3 mb-5">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              This transaction is <strong>completed</strong> and is now read-only.
            </p>
          </div>
        )}

        {txn.is_sla_breached && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mb-5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              SLA Breached — actual duration exceeded the {formatDuration(txn.sla_target_seconds)} target.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Service info card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{txn.service_name}</p>
                  <p className="text-sm text-muted-foreground">{txn.service_category} · {txn.office_name}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                    <p className="font-medium text-foreground">{txn.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Created By</p>
                    <p className="font-medium text-foreground">{txn.created_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Time In </p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateTime(txn.time_in)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Time Out  </p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {txn.time_out ? formatDateTime(txn.time_out) : <span className="text-muted-foreground italic">Auto on completion</span>}
                    </p>
                  </div>
                  {txn.remarks && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">Remarks</p>
                      <p className="text-foreground">{txn.remarks}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status flow — EMS-006 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Transaction Status </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress steps */}
                <div className="flex items-start gap-2">
                  <StatusStep status="pending" current={txn.status} completed={txn.status === 'completed'} />
                  <div className="h-2 w-4 mt-0 self-start pt-0.5" />
                  <StatusStep status="in_progress" current={txn.status} completed={txn.status === 'completed'} />
                  <div className="h-2 w-4 mt-0 self-start pt-0.5" />
                  <StatusStep status="completed" current={txn.status} completed={txn.status === 'completed'} />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={txn.status} />
                </div>

                {canModify && nextStatus && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs text-muted-foreground">Remarks for status change</Label>
                    <Textarea
                      placeholder="Optional remarks…"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={() => handleStatusUpdate(nextStatus)}
                      disabled={updating}
                      size="sm"
                      variant={nextStatus === 'completed' ? 'success' : 'default'}
                    >
                      {nextStatus === 'in_progress' ? (
                        <><RotateCcw className="h-4 w-4" /> Mark In Progress</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Mark Completed</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentary status — EMS-007 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Documentary Status </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DocumentaryBadge status={txn.documentary_status} />
                {txn.documentary_status === 'incomplete' && (
                  <p className="text-xs text-destructive">
                    SLA timer paused — transaction marked Incomplete is excluded from SLA timing until resolved.
                  </p>
                )}
                {canModify && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    {(['complete', 'incomplete', 'for_compliance'] as DocumentaryStatus[]).map((s) => (
                      <Button
                        key={s}
                        variant={txn.documentary_status === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDocStatusUpdate(s)}
                        disabled={updating || txn.documentary_status === s}
                      >
                        {s === 'complete' ? 'Complete' : s === 'incomplete' ? 'Incomplete' : 'For Compliance'}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign — EMS-005 */}
            {canModify && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Assignment </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {txn.assigned_to_name ?? <span className="italic text-muted-foreground">Unassigned</span>}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reassign to (same-office staff)</Label>
                    <Select
                      onValueChange={(v) => handleAssign(v)}
                      disabled={updating}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Select staff…" />
                      </SelectTrigger>
                      <SelectContent>
                        {officeUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar — SLA + Timeline */}
          <div className="space-y-5">
            {/* SLA Card — EMS-009, 010, 011 */}
            <Card className={cn(txn.is_sla_breached && 'border-destructive/30')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SLA Compliance </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SLABadge status={txn.sla_status} isBreached={txn.is_sla_breached} />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SLA Target</span>
                    <span className="font-medium text-foreground">{formatDuration(txn.sla_target_seconds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Time</span>
                    <span className="font-medium text-foreground">
                      {txn.processing_time_seconds !== null
                        ? formatDuration(txn.processing_time_seconds)
                        : '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={cn('font-medium', txn.is_sla_breached ? 'text-destructive' : 'text-success')}>
                      {slaVariance(txn)}
                    </span>
                  </div>
                </div>
                {txn.sla_status === 'pending_computation' && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    SLA will be computed and submitted to PSS when this transaction is completed (EMS-010).
                  </p>
                )}
                {txn.sla_status !== 'pending_computation' && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    Classification is automated and immutable (EMS-011).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Audit Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Audit Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {history.map((h) => (
                      <div key={h.id} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {h.new_status === 'pending' && h.old_status === null
                              ? 'Created'
                              : `Status: ${h.old_status} → ${h.new_status}`}
                            {h.documentary_old !== h.documentary_new && ` · Docs: ${h.documentary_old ?? '—'} → ${h.documentary_new}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{h.changed_by_name} · {formatDateTime(h.changed_at)}</p>
                          {h.remarks && <p className="text-xs text-muted-foreground italic mt-0.5">{h.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
