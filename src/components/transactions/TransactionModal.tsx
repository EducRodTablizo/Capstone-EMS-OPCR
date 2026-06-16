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
import { ServiceDynamicFields } from './ServiceDynamicFields'
import { TransactionFormProvider, useTransactionForm } from './TransactionFormProvider'
import type { TransactionFormValues } from './transactionTypes'
import { useModals } from '@/components/shared/ModalContext'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  currentUser: User | null
  onCreated: (transaction: Transaction) => void
}

const ASSIGNED_TO_OPTIONS = [
  { id: 'usr-2', name: 'Jose Reyes' },
  { id: 'usr-3', name: 'Ana Cruz' },
  { id: 'usr-5', name: 'Lucia Gonzales' },
  { id: 'usr-6', name: 'Paolo Ramos' },
  { id: 'usr-8', name: 'Marco Flores' },
]

function TransactionModalInner({ open, onOpenChange, services, currentUser, onCreated }: TransactionModalProps) {
  const { methods, selectedService, selectedServiceConfig } = useTransactionForm()
  const { handleSubmit, control, formState } = methods
  const errors = formState.errors as Record<string, { message?: string }>
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, showResult } = useModals()

  const selectedServiceName = selectedService?.name || ''
  const selectedServiceCategory = selectedService?.category || 'Service'

  const mutation = useMutation<Transaction, Error, CreateTransactionDto>({
    mutationFn: async (payload) => {
      if (!currentUser) throw new Error('User not authenticated')
      return createTransactionApi(payload, currentUser)
    },
    onSuccess: (transaction: Transaction) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      showResult({
        type: 'success',
        title: 'Success!',
        message: 'Transaction created successfully. Time-in recorded.',
        buttonText: 'Got it!',
        onConfirm: () => {
          onCreated(transaction)
          onOpenChange(false)
          navigate(`/transactions/${transaction.id}`)
        }
      })
    },
    onError: (error: Error) => {
      showResult({
        type: 'error',
        title: 'Error!',
        message: error.message || 'Could not create transaction',
        buttonText: 'Dismiss'
      })
    },
  })

  const onSubmit = (values: TransactionFormValues) => {
    confirm({
      title: 'Confirm Submission',
      message: 'Are you sure you want to submit this transaction? This will record the time-in and initialize OPCR service targets.',
      confirmText: 'Confirm',
      onConfirm: () => {
        const documentationStatus = selectedServiceConfig?.documentation
          ? Object.values(values.service_specific_data.documentaryCompliance || {}).every(Boolean)
            ? 'complete'
            : 'incomplete'
          : 'complete'

        const middlePart = values.client_middle_name?.trim() ? ` ${values.client_middle_name.trim()}` : ''
        const fullClientName = `${values.client_first_name.trim()}${middlePart} ${values.client_surname.trim()}`

        const payload: CreateTransactionDto = {
          service_id: values.service_id,
          assigned_to:
            values.assigned_to && values.assigned_to !== 'UNASSIGNED' ? values.assigned_to : undefined,
          client_name: fullClientName,
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
    })
  }

  const handleCancelClick = () => {
    confirm({
      title: 'Discard Changes',
      message: 'Are you sure? You have unsaved changes. All draft data will be lost.',
      confirmText: 'Confirm',
      onConfirm: () => {
        onOpenChange(false)
      }
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      confirm({
        title: 'Discard Changes',
        message: 'Are you sure? You have unsaved changes. All draft data will be lost.',
        confirmText: 'Confirm',
        onConfirm: () => {
          onOpenChange(false)
        }
      })
    } else {
      onOpenChange(true)
    }
  }

  const remarksText = methods.watch('remarks') || ''

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-6xl w-full max-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="flex h-full flex-col overflow-hidden">
            <DialogHeader>
              <div className="mb-3 flex flex-col gap-2">
                <DialogTitle className="text-2xl font-bold tracking-tight">New Service Transaction</DialogTitle>
                <DialogDescription>
                  Record a new transaction and auto-generate time-in, SLA, and audit timeline.
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedServiceCategory}</Badge>
                  {selectedServiceName ? <Badge variant="default" className="bg-[#580000] text-white">{selectedServiceName}</Badge> : null}
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden px-6 pb-6">
              <div className="grid gap-6 overflow-y-auto pr-2 pb-4" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[#580000]">Service Information</p>
                      </div>
                      <Badge variant="outline" className="border-[#C8960C] text-[#C8960C] font-semibold">Time-In auto-recorded</Badge>
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
                      <div className="flex items-center justify-between">
                        <Label>Remarks (Optional)</Label>
                        <span className="text-xs text-muted-foreground">{remarksText.length} / 255</span>
                      </div>
                      <Controller
                        name="remarks"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <>
                            <Textarea
                              value={field.value}
                              onChange={(e) => {
                                if (e.target.value.length <= 255) {
                                  field.onChange(e.target.value)
                                }
                              }}
                              placeholder="Optional remarks…"
                              rows={3}
                            />
                            {errors.remarks?.message && (
                              <p className="text-xs text-destructive">{errors.remarks.message}</p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <p className="text-lg font-semibold text-[#580000]">Client Information</p>
                      <p className="text-xs text-muted-foreground">Additional client details for the transaction.</p>
                    </div>

                    {/* Standardized Client Name Split */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>First Name *</Label>
                        <Controller
                          name="client_first_name"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <>
                              <Input placeholder="First Name" value={field.value} onChange={field.onChange} />
                              {errors.client_first_name?.message && (
                                <p className="text-xs text-destructive">{errors.client_first_name.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Middle Name (Optional)</Label>
                        <Controller
                          name="client_middle_name"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input placeholder="Middle Name (Optional)" value={field.value} onChange={field.onChange} />
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Surname *</Label>
                        <Controller
                          name="client_surname"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <>
                              <Input placeholder="Surname" value={field.value} onChange={field.onChange} />
                              {errors.client_surname?.message && (
                                <p className="text-xs text-destructive">{errors.client_surname.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Student Number (Optional)</Label>
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
                      <div className="space-y-1.5">
                        <Label>Course / Program (Optional)</Label>
                        <Controller
                          name="course"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input placeholder="e.g., BSIT (BS Information Technology)" value={field.value} onChange={field.onChange} />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Year Level (Optional)</Label>
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
                      <div className="space-y-1.5">
                        <Label>Contact Number *</Label>
                        <Controller
                          name="contact_number"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <>
                              <Input placeholder="09XXXXXXXXX" value={field.value} onChange={field.onChange} />
                              {errors.contact_number?.message && (
                                <p className="text-xs text-destructive">{errors.contact_number.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Organization / Institution (Optional)</Label>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <p className="text-lg font-semibold text-[#580000]">Service-Specific Fields (Optional)</p>
                      <p className="text-xs text-muted-foreground">Fields change depending on the selected service.</p>
                    </div>
                    <ServiceDynamicFields />
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="border-t border-border pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end w-full">
                  <Button variant="outline" type="button" onClick={handleCancelClick}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#580000] text-white hover:bg-[#7a0c0c]" disabled={mutation.status === 'pending'}>
                    {mutation.status === 'pending' ? 'Saving…' : 'Submit Transaction'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function TransactionModal(props: TransactionModalProps) {
  const defaultValues: TransactionFormValues = {
    service_id: '',
    assigned_to: '',
    client_type: 'Student',
    client_name: '',
    client_first_name: '',
    client_middle_name: '',
    client_surname: '',
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
