import { useState, useEffect } from 'react'
import { Clock, Calendar, Info } from 'lucide-react'
import type { Service, User, Transaction } from '@/types'
import type { IntakeField } from '@/utils/serviceIntakeSchema'
import { getIntakeSchema } from '@/utils/serviceIntakeSchema'
import { computeSlaDueDate, formatSlaDueDate } from '@/utils/workingCalendar'
import { createTransactionApi } from '@/api/mockApi'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  officeUsers: User[]
  currentUser: User
  onCreated: (txn: Transaction) => void
}

export function CreateTransactionDialog({
  open, onOpenChange, services, officeUsers, currentUser, onCreated,
}: Props) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ service_id: '', assigned_to: '', client_name: '', remarks: '' })
  const [intakeData, setIntakeData] = useState<Record<string, string>>({})

  const selectedService = services.find((s) => s.id === form.service_id) ?? null
  const schema = form.service_id ? getIntakeSchema(form.service_id) : null

  // Reset dynamic fields when service changes
  useEffect(() => { setIntakeData({}) }, [form.service_id])

  const setField = (key: string, value: string) =>
    setIntakeData((prev) => ({ ...prev, [key]: value }))

  const requiredIntakeFilled =
    !schema ||
    schema.fields
      .filter((f) => f.required)
      .every((f) => (intakeData[f.key] ?? '').trim() !== '')

  const canSubmit = !!form.service_id && !!form.client_name.trim() && requiredIntakeFilled

  const slaDuePreview = selectedService
    ? formatSlaDueDate(computeSlaDueDate(new Date().toISOString(), selectedService.sla_target_seconds))
    : null

  async function handleCreate() {
    if (!canSubmit) return
    setCreating(true)
    try {
      const txn = await createTransactionApi(
        {
          service_id: form.service_id,
          assigned_to: form.assigned_to || undefined,
          client_name: form.client_name.trim(),
          remarks: form.remarks.trim() || undefined,
          intake_data: Object.keys(intakeData).length > 0 ? intakeData : undefined,
        },
        currentUser,
      )
      onCreated(txn)
      onOpenChange(false)
      setForm({ service_id: '', assigned_to: '', client_name: '', remarks: '' })
      setIntakeData({})
      toast({
        title: 'Transaction created',
        description: `Time-in recorded: ${formatDateTime(txn.time_in)}`,
        variant: 'success',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  function renderIntakeField(field: IntakeField) {
    const value = intakeData[field.key] ?? ''
    const sharedClass = 'text-sm'

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.key}
            className={sharedClass}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
          />
        )
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => setField(field.key, v)}>
            <SelectTrigger className={sharedClass}>
              <SelectValue placeholder={`Select…`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'date':
        return (
          <Input
            id={field.key}
            type="date"
            className={sharedClass}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        )
      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            className={sharedClass}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            placeholder={field.placeholder}
            min={0}
          />
        )
      default:
        return (
          <Input
            id={field.key}
            className={sharedClass}
            value={value}
            onChange={(e) => setField(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[92vh]">
        <DialogHeader>
          <DialogTitle className="text-base">New Service Transaction</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            EMS-004: Time-in is automatically recorded upon submission.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-1 pr-1">

          {/* ── Service selector ── */}
          <div className="space-y-1.5">
            <Label htmlFor="service_id">
              Service <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.service_id}
              onValueChange={(v) => setForm({ ...form, service_id: v })}
            >
              <SelectTrigger id="service_id">
                <SelectValue placeholder="Select a service…" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.category} · SLA: {s.sla_display}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SLA preview */}
            {selectedService && slaDuePreview && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  Estimated SLA Deadline (working hours):
                  <strong className="text-foreground ml-1">{slaDuePreview}</strong>
                </p>
                <Badge variant="muted" className="text-[10px] shrink-0">
                  {selectedService.category}
                </Badge>
              </div>
            )}
          </div>

          {/* ── Client name ── */}
          <div className="space-y-1.5">
            <Label htmlFor="client_name">
              Client Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client_name"
              placeholder="Full name of the person being served…"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>

          {/* ── Dynamic intake form ── */}
          {schema && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{schema.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Fill in the service-specific intake fields below.
                      Fields marked <span className="text-destructive">*</span> are required.
                    </p>
                  </div>
                </div>

                <div className={cn(
                  'rounded-lg border border-border bg-muted/20 p-4 space-y-4',
                )}>
                  {schema.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label
                        htmlFor={field.key}
                        className={cn(
                          'text-xs',
                          field.required && "after:content-['*'] after:ml-0.5 after:text-destructive",
                        )}
                      >
                        {field.label}
                      </Label>
                      {renderIntakeField(field)}
                      {field.helpText && (
                        <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* ── Assign To (EMS-005) ── */}
          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select
              value={form.assigned_to}
              onValueChange={(v) => setForm({ ...form, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {officeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role === 'subsystem_admin' ? 'Admin' : 'Staff'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Only staff within your office can be assigned (EMS-005)
            </p>
          </div>

          {/* ── Remarks ── */}
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea
              placeholder="Optional remarks…"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating || !canSubmit}>
            {creating ? 'Creating…' : 'Create & Record Time-In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
