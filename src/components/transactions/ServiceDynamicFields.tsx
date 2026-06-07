import { Controller, type Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTransactionForm } from './TransactionFormProvider'
import { DocumentationChecklist } from './DocumentationChecklist'
import type { ServiceField } from '@/config/serviceConfig'
import type { TransactionFormValues } from './transactionTypes'

function renderField(field: ServiceField, control: Control<TransactionFormValues>, errors: Record<string, unknown>) {
  const fieldName = `service_specific_data.${field.name}` as const
  const errorMessage = (errors?.[field.name] as { message?: string } | undefined)?.message

  if (field.type === 'textarea') {
    return (
      <Controller
        key={field.name}
        name={fieldName}
        control={control}
        defaultValue=""
        render={({ field: controllerField }) => (
          <div className="space-y-1.5">
            <Label>{field.label}{field.required ? ' *' : ''}</Label>
            <Textarea
              value={controllerField.value}
              onChange={controllerField.onChange}
              placeholder={field.placeholder}
              rows={3}
            />
            {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          </div>
        )}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <Controller
        key={field.name}
        name={fieldName}
        control={control}
        defaultValue=""
        render={({ field: controllerField }) => (
          <div className="space-y-1.5">
            <Label>{field.label}{field.required ? ' *' : ''}</Label>
            <Select value={controllerField.value} onValueChange={controllerField.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder ?? 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          </div>
        )}
      />
    )
  }

  if (field.type === 'checkboxGroup') {
    return null
  }

  return (
    <Controller
      key={field.name}
      name={fieldName}
      control={control}
      defaultValue=""
      render={({ field: controllerField }) => (
        <div className="space-y-1.5">
          <Label>{field.label}{field.required ? ' *' : ''}</Label>
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={controllerField.value}
            onChange={controllerField.onChange}
            placeholder={field.placeholder}
          />
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
        </div>
      )}
    />
  )
}

export function ServiceDynamicFields() {
  const { methods, selectedServiceConfig, selectedService } = useTransactionForm()
  const { control, formState } = methods
  const errors = (formState.errors.service_specific_data ?? {}) as Record<string, unknown>

  if (!selectedServiceConfig) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        {selectedService
          ? `No custom fields configured for ${selectedService.name}. Please proceed with the standard client details.`
          : 'Select a service to reveal service-specific fields.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedServiceConfig.fields.map((field) => renderField(field, control, errors))}
      {selectedServiceConfig.documentation ? (
        <DocumentationChecklist items={selectedServiceConfig.documentation} />
      ) : null}
    </div>
  )
}
