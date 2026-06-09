import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, User2, AlertTriangle, CheckCircle2,
  Lock, RotateCcw, PlusCircle, RefreshCw, UserCheck, FileText, MessageSquare,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  getTransactionApi, getTransactionHistoryApi,
  updateTransactionStatusApi, updateDocumentaryStatusApi,
  assignTransactionApi, getUsersApi,
} from '@/api/mockApi'
import type { Transaction, TransactionStatusHistory, User, TransactionStatus, DocumentaryStatus, ActionType } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
        isDone ? 'bg-[#1D9E75]' : isActive ? 'bg-[#580000]' : 'bg-muted',
      )} />
      <span className={cn(
        'text-xs font-semibold',
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

  // Status/Document update remarks
  const [statusRemarks, setStatusRemarks] = useState('')
  const [docRemarks, setDocRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  // Confirmation Modals State
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<TransactionStatus | null>(null)

  const [showDocConfirm, setShowDocConfirm] = useState(false)
  const [pendingDocStatus, setPendingDocStatus] = useState<DocumentaryStatus | null>(null)

  const [showAssignConfirm, setShowAssignConfirm] = useState(false)
  const [pendingAssignee, setPendingAssignee] = useState<User | null>(null)

  // EMS-025: locked = completed (is_locked set atomically on completion)
  const canModify = user?.role !== 'opcr_evaluator' && !txn?.is_locked

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

  // Trigger Status Update Confirm
  function triggerStatusUpdate(newStatus: TransactionStatus) {
    setPendingStatus(newStatus)
    setShowStatusConfirm(true)
  }

  async function handleStatusUpdate() {
    if (!txn || !user || !pendingStatus) return
    setShowStatusConfirm(false)
    setUpdating(true)
    try {
      const updated = await updateTransactionStatusApi(
        txn.id,
        { status: pendingStatus, remarks: statusRemarks || undefined },
        user
      )
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      setStatusRemarks('')
      toast({ title: `Status → ${pendingStatus.replace('_', ' ')}`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
      setPendingStatus(null)
    }
  }

  // Trigger Documentary Status Update Confirm
  function triggerDocStatusUpdate(newStatus: DocumentaryStatus) {
    setPendingDocStatus(newStatus)
    setShowDocConfirm(true)
  }

  async function handleDocStatusUpdate() {
    if (!txn || !user || !pendingDocStatus) return
    setShowDocConfirm(false)
    setUpdating(true)
    try {
      const updated = await updateDocumentaryStatusApi(
        txn.id,
        { documentary_status: pendingDocStatus, remarks: docRemarks || undefined },
        user
      )
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      setDocRemarks('')
      toast({ title: `Documentary status updated`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
      setPendingDocStatus(null)
    }
  }

  // Reassignment handlers
  function handleAssignSelection(userId: string) {
    if (!txn) return
    if (userId === txn.assigned_to) return
    const assignee = officeUsers.find((u) => u.id === userId)
    if (!assignee) return
    setPendingAssignee(assignee)
    setShowAssignConfirm(true)
  }

  async function confirmReassign() {
    if (!txn || !user || !pendingAssignee) return
    setShowAssignConfirm(false)
    setUpdating(true)
    try {
      const previousAssignee = txn.assigned_to_name ?? 'Unassigned'
      const updated = await assignTransactionApi(txn.id, pendingAssignee.id, user)
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      toast({
        title: 'Reassignment complete',
        description: `${previousAssignee} → ${pendingAssignee.name}`,
        variant: 'success',
      })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setUpdating(false)
      setPendingAssignee(null)
    }
  }

  function getHistoryLabel(item: TransactionStatusHistory) {
    switch (item.action_type) {
      case 'CREATE':         return 'Transaction Created'
      case 'STATUS_CHANGE':  return `Status Changed`
      case 'ASSIGNMENT':     return 'Assignee Updated'
      case 'DOCUMENTARY_CHANGE': return 'Documentary Status Updated'
      case 'REMARKS_UPDATE': return 'Remarks Updated'
      default:               return item.remarks ?? 'Log Entry'
    }
  }

  const ACTION_ICON: Record<ActionType, typeof PlusCircle> = {
    CREATE:             PlusCircle,
    STATUS_CHANGE:      RefreshCw,
    ASSIGNMENT:         UserCheck,
    DOCUMENTARY_CHANGE: FileText,
    REMARKS_UPDATE:     MessageSquare,
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
    <div className="flex flex-col h-full min-h-0">
      <TopBar />

      <div className="flex-1 min-h-0 overflow-auto p-6 bg-[#F5F7FA]">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-[#580000] shadow-sm transition-colors hover:bg-slate-50 mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transaction
        </Link>

        {/* EMS-025: Completed – Read Only lock notice */}
        {txn.is_locked && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-[#E6F1FB] px-4 py-3 mb-5">
            <Lock className="h-4 w-4 text-[#1B3A6B] shrink-0" />
            <p className="text-sm text-[#1B3A6B] font-medium">
              This transaction is <strong>completed</strong> and is now read-only.
            </p>
          </div>
        )}

        {txn.is_sla_breached && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-[#FCEBEB] px-4 py-3 mb-5">
            <AlertTriangle className="h-4 w-4 text-[#E24B4A] shrink-0" />
            <p className="text-sm text-[#E24B4A] font-medium">
              SLA Breached — actual duration exceeded the {formatDuration(txn.sla_target_seconds)} target.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Service info card */}
            <Card className="rounded-xl border border-border shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle className="section-header">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{txn.service_name}</p>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-0.5">{txn.service_category} · {txn.office_name}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Client</p>
                    <p className="font-semibold text-foreground">{txn.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Created By</p>
                    <p className="font-semibold text-foreground">{txn.created_by_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Time In</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDateTime(txn.time_in)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Time Out</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {txn.time_out ? formatDateTime(txn.time_out) : <span className="text-muted-foreground italic font-normal">Auto on completion</span>}
                    </p>
                  </div>
                  {txn.remarks && (
                    <div className="col-span-2 bg-[#F5F7FA] p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 font-bold">Remarks</p>
                      <p className="text-sm text-foreground">{txn.remarks}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status flow — EMS-006 */}
            <Card className="rounded-xl border border-border shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle className="section-header">Transaction Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {/* Progress steps */}
                <div className="flex items-start gap-2 max-w-md mx-auto pt-2">
                  <StatusStep status="pending" current={txn.status} completed={txn.status === 'completed'} />
                  <div className="h-2 w-4 mt-0 self-start pt-0.5" />
                  <StatusStep status="in_progress" current={txn.status} completed={txn.status === 'completed'} />
                  <div className="h-2 w-4 mt-0 self-start pt-0.5" />
                  <StatusStep status="completed" current={txn.status} completed={txn.status === 'completed'} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium">Current Status:</span>
                  <StatusBadge status={txn.status} />
                </div>

                {canModify && nextStatus && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Remarks for status change (Optional)</Label>
                      <span className="text-[10px] text-muted-foreground">{statusRemarks.length} / 255</span>
                    </div>
                    <Textarea
                      placeholder="Optional status remarks…"
                      value={statusRemarks}
                      onChange={(e) => {
                        if (e.target.value.length <= 255) {
                          setStatusRemarks(e.target.value)
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      onClick={() => triggerStatusUpdate(nextStatus)}
                      disabled={updating}
                      size="sm"
                      className={cn(
                        "text-white",
                        nextStatus === 'completed' ? 'bg-[#1D9E75] hover:bg-[#15805d]' : 'bg-[#580000] hover:bg-[#7a0c0c]'
                      )}
                    >
                      {nextStatus === 'in_progress' ? (
                        <><RotateCcw className="h-4 w-4 mr-1.5" /> Mark In Progress</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Completed</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentary Status (Horizontal remarks & badges layout) */}
            <Card className="rounded-xl border border-border shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle className="section-header">Documentary Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Horizontal display: status beside remarks */}
                <div className="flex items-center gap-3 flex-wrap bg-[#F5F7FA] p-3 rounded-lg border border-border/50">
                  <DocumentaryBadge status={txn.documentary_status} />
                  {txn.remarks && (
                    <>
                      <span className="text-muted-foreground/40 font-semibold">|</span>
                      <span className="text-xs font-semibold text-muted-foreground">Remarks:</span>
                      <span className="text-xs text-foreground font-medium">{txn.remarks}</span>
                    </>
                  )}
                </div>

                {txn.documentary_status === 'incomplete' && (
                  <p className="text-xs text-[#BA7517] bg-[#FAEEDA] px-3 py-2 rounded border border-[#BA7517]/20 font-medium">
                    SLA timer paused — transaction marked Incomplete is excluded from SLA timing until resolved.
                  </p>
                )}

                {/* Horizontal update alignment */}
                {canModify && (
                  <div className="pt-3 border-t border-border flex flex-col md:flex-row md:items-end gap-4">
                    {/* Buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Label className="text-xs text-muted-foreground">Update Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {(['complete', 'incomplete', 'for_compliance'] as DocumentaryStatus[]).map((s) => (
                          <Button
                            key={s}
                            variant={txn.documentary_status === s ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => triggerDocStatusUpdate(s)}
                            disabled={updating || txn.documentary_status === s}
                            className={cn(
                              txn.documentary_status === s && "bg-[#580000] text-white hover:bg-[#580000]"
                            )}
                          >
                            {s === 'complete' ? 'Complete' : s === 'incomplete' ? 'Incomplete' : 'For Compliance'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Remarks Input Beside Status */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Documentary Remarks (Optional)</Label>
                        <span className="text-[10px] text-muted-foreground">{docRemarks.length} / 255</span>
                      </div>
                      <Input
                        placeholder="Remarks (e.g. missing attachment)..."
                        value={docRemarks}
                        onChange={(e) => {
                          if (e.target.value.length <= 255) {
                            setDocRemarks(e.target.value)
                          }
                        }}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reassign (Confirmation modal updated) */}
            {canModify && (
              <Card className="rounded-xl border border-border shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-border/80">
                  <CardTitle className="section-header">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground font-semibold">
                      {txn.assigned_to_name ?? <span className="italic text-muted-foreground font-normal">Unassigned</span>}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <Label className="text-xs text-muted-foreground">Reassign to (same-office staff)</Label>
                    <Select
                      value={txn.assigned_to ?? undefined}
                      onValueChange={handleAssignSelection}
                      disabled={updating}
                    >
                      <SelectTrigger>
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
            <Card className={cn("rounded-xl border border-border shadow-sm bg-white", txn.is_sla_breached && 'border-destructive/30')}>
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle className="section-header">SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <SLABadge status={txn.sla_status} isBreached={txn.is_sla_breached} />
                <div className="space-y-2 text-sm pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">SLA Target</span>
                    <span className="font-semibold text-foreground">{formatDuration(txn.sla_target_seconds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Actual Time</span>
                    <span className="font-semibold text-foreground">
                      {txn.processing_time_seconds !== null
                        ? formatDuration(txn.processing_time_seconds)
                        : '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Variance</span>
                    <span className={cn('font-bold', txn.is_sla_breached ? 'text-[#E24B4A]' : 'text-[#1D9E75]')}>
                      {slaVariance(txn)}
                    </span>
                  </div>
                </div>
                {txn.sla_status === 'pending_computation' && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
                    SLA will be computed and submitted to PSS when this transaction is completed (EMS-010).
                  </p>
                )}
                {txn.sla_status !== 'pending_computation' && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
                    Classification is automated and immutable (EMS-011).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Audit Timeline — EMS-015 */}
            <Card className="rounded-xl border border-border shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-border/80">
                <CardTitle className="section-header">Audit Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {history.map((h) => {
                      const Icon = ACTION_ICON[h.action_type] ?? RotateCcw
                      const hasValueChange = (h.old_value !== null || h.new_value !== null) && h.action_type !== 'CREATE'
                      return (
                        <div key={h.id} className="relative pl-6">
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-background border-2 border-[#580000] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#580000]" />
                          </div>
                          <div className="space-y-0.5">
                            {/* AC-1: action label + AC-3: action type badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <p className="text-xs font-semibold text-foreground">
                                {getHistoryLabel(h)}
                              </p>
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                                {h.action_type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            {/* AC-2: actor + AC-5: timestamp */}
                            <p className="text-[11px] text-muted-foreground">
                              {h.changed_by_name} · {formatDateTime(h.changed_at)}
                            </p>
                            {/* AC-4: old → new value */}
                            {hasValueChange && (
                              <p className="text-[11px] text-muted-foreground font-mono bg-muted/30 border border-border/40 rounded px-2 py-1 mt-1">
                                {h.old_value ?? '—'} <span className="text-primary/80 mx-1">→</span> {h.new_value ?? '—'}
                              </p>
                            )}
                            {h.documentary_old !== h.documentary_new && h.action_type === 'DOCUMENTARY_CHANGE' && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Docs: {h.documentary_old ?? '—'} → {h.documentary_new}
                              </p>
                            )}
                            {h.remarks && h.action_type !== 'CREATE' && (
                              <p className="text-xs text-muted-foreground italic mt-1 bg-muted/30 p-1.5 rounded border border-border/40">
                                {h.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Status Change */}
      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="modal-title text-[#580000]">Confirm Status Update</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to mark this transaction as <strong>{pendingStatus?.replace('_', ' ')}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowStatusConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} className="bg-[#580000] text-white hover:bg-[#7a0c0c]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Documentary Status Change */}
      <Dialog open={showDocConfirm} onOpenChange={setShowDocConfirm}>
        <DialogContent className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="modal-title text-[#580000]">Confirm Documentary Status Update</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to change the documentary status to <strong>{pendingDocStatus}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDocConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleDocStatusUpdate} className="bg-[#580000] text-white hover:bg-[#7a0c0c]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Reassignment */}
      <Dialog open={showAssignConfirm} onOpenChange={setShowAssignConfirm}>
        <DialogContent className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="modal-title text-[#580000]">Confirm Reassignment</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to reassign this transaction from <strong>{txn.assigned_to_name ?? 'Unassigned'}</strong> to <strong>{pendingAssignee?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignConfirm(false)
                setPendingAssignee(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmReassign} className="bg-[#580000] text-white hover:bg-[#7a0c0c]">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
