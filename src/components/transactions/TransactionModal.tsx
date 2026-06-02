import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller } from 'react-hook-form'
import type { Service, User, Transaction, CreateTransactionDto } from '@/types'
import { createTransactionApi } from '@/api/mockApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/useToast'
import { ServiceDynamicFields } from './ServiceDynamicFields'
import { TransactionFormProvider, useTransactionForm } from './TransactionFormProvider'
import type { TransactionFormValues } from './transactionTypes'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  currentUser: User | null
  onCreated: (transaction: Transaction) => void
}

const ASSIGNED_TO_OPTIONS = [
  { id: 'rod-benedict-tablizo', name: 'Rod Benedict Tablizo' },
  { id: 'cedrick-a-asusela', name: 'Cedrick A. Asusula' },
  { id: 'ryan-bill-donayre', name: 'Ryan Bill Donayre' },
  { id: 'mark-bellen', name: 'Mark Bellen' },
]

function TransactionModalInner({ open, onOpenChange, services, currentUser, onCreated }: TransactionModalProps) {
  const { methods, selectedService, selectedServiceConfig } = useTransactionForm()
  const { handleSubmit, control, formState } = methods
  const errors = formState.errors as Record<string, any>
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const selectedServiceName = selectedService?.name || ''
  const selectedServiceCategory = selectedService?.category || 'Service'

  const mutation = useMutation<Transaction, Error, CreateTransactionDto>({
    mutationFn: async (payload) => {
      if (!currentUser) throw new Error('User not authenticated')
      return createTransactionApi(payload, currentUser)
    },
    onSuccess: (transaction: Transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onCreated(transaction)
      onOpenChange(false)
      toast({ title: 'Transaction created', description: `Time-in recorded`, variant: 'success' })
      navigate(`/transactions/${transaction.id}`)
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not create transaction',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = async (values: TransactionFormValues) => {
    if (!currentUser) return

    const documentationStatus = selectedServiceConfig?.documentation
      ? Object.values(values.service_specific_data.documentaryCompliance || {}).every(Boolean)
        ? 'complete'
        : 'incomplete'
      : 'complete'

    const payload: CreateTransactionDto = {
      service_id: values.service_id,
      assigned_to:
        values.assigned_to && values.assigned_to !== 'UNASSIGNED' ? values.assigned_to : undefined,
      client_name: values.client_name.trim(),
      client_type: values.client_type,
      student_number: values.student_number?.trim() || undefined,
      course: values.course?.trim() || undefined,
      year_level: values.year_level?.trim() || undefined,
      contact_number: values.contact_number.trim(),
      organization: values.organization?.trim() || undefined,
      remarks: values.remarks?.trim() || undefined,
      documentation_status: documentationStatus,
      service_specific_data: values.service_specific_data,
    }

    mutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader>
            <div className="mb-3 flex flex-col gap-2">
              <DialogTitle>New Service Transaction</DialogTitle>
              <DialogDescription>
                Record a new transaction and auto-generate time-in, SLA, and audit timeline.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedServiceCategory}</Badge>
                {selectedServiceName ? <Badge variant="default">{selectedServiceName}</Badge> : null}
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden px-6 pb-6">
            <div className="grid gap-6 overflow-y-auto pr-2 pb-4" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Service Information</p>
                      <p className="text-xs text-muted-foreground">EMS-004 / EMS-005 metadata</p>
                    </div>
                    <Badge variant="outline">Time-In auto-recorded</Badge>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Office / Service Office</Label>
                      <Input value={currentUser?.office_name ?? ''} disabled />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Service Type *</Label>
                      <Controller
                        name="service_id"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service…" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {services.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    <div className="flex flex-col gap-1 text-left">
                                      <span>{service.name}</span>
                                      <span className="text-xs text-muted-foreground">{service.category}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.service_id?.message && (
                              <p className="text-xs text-destructive">{errors.service_id.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Assign To</Label>
                      <Controller
                        name="assigned_to"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                              {ASSIGNED_TO_OPTIONS.map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Only office staff can be assigned.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Client Type *</Label>
                      <Controller
                        name="client_type"
                        control={control}
                        defaultValue="Student"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Visitor">Visitor</SelectItem>
                              <SelectItem value="Organization">Organization</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Controller
                      name="remarks"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <Textarea
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Optional remarks…"
                          rows={3}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Client Information</p>
                    <p className="text-xs text-muted-foreground">Additional client details for the transaction.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Client Name *</Label>
                      <Controller
                        name="client_name"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Input placeholder="Enter full name" value={field.value} onChange={field.onChange} />
                            {errors.client_name?.message && (
                              <p className="text-xs text-destructive">{errors.client_name.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Student Number</Label>
                      <Controller
                        name="student_number"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Input
                              placeholder="2026-01234-CM-0"
                              value={field.value}
                              onChange={field.onChange}
                            />
                            {errors.student_number?.message && (
                              <p className="text-xs text-destructive">{errors.student_number.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Course / Program</Label>
                      <Controller
                        name="course"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <Input placeholder="e.g., BSIT (BS Information Technology)" value={field.value} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Year Level</Label>
                      <Controller
                        name="year_level"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st Year">1st Year</SelectItem>
                              <SelectItem value="2nd Year">2nd Year</SelectItem>
                              <SelectItem value="3rd Year">3rd Year</SelectItem>
                              <SelectItem value="4th Year">4th Year</SelectItem>
                              <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Contact Number *</Label>
                      <Controller
                        name="contact_number"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Input placeholder="+63XXXXXXXXXX or 09XXXXXXXXX" value={field.value} onChange={field.onChange} />
                            {errors.contact_number?.message && (
                              <p className="text-xs text-destructive">{errors.contact_number.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Organization / Institution</Label>
                      <Controller
                        name="organization"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Input placeholder="e.g., CommiT Society" value={field.value} onChange={field.onChange} />
                            {errors.organization?.message && (
                              <p className="text-xs text-destructive">{errors.organization.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Service-Specific Fields</p>
                    <p className="text-xs text-muted-foreground">Fields change depending on the selected service.</p>
                  </div>
                  <ServiceDynamicFields />
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.status === 'pending'}>
                  {mutation.status === 'pending' ? 'Saving…' : 'Submit Transaction'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TransactionModal(props: TransactionModalProps) {
  const defaultValues: TransactionFormValues = {
    service_id: '',
    assigned_to: '',
    client_type: 'Student',
    client_name: '',
    student_number: '',
    course: '',
    year_level: '',
    contact_number: '',
    organization: '',
    remarks: '',
    service_specific_data: {
      documentaryCompliance: {
        studentID: false,
        enrollmentForm: false,
        clearance: false,
      },
    },
  }

  return (
    <TransactionFormProvider services={props.services} defaultValues={defaultValues} open={props.open}>
      <TransactionModalInner {...props} />
    </TransactionFormProvider>
  )
}
