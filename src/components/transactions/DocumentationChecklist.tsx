import { Controller } from 'react-hook-form'
import { useTransactionForm } from './TransactionFormProvider'
import { Label } from '@/components/ui/label'
import type { FieldErrors } from 'react-hook-form'
import type { TransactionFormValues } from './transactionTypes'

interface DocumentationChecklistProps {
  items: { name: string; label: string }[]
}

export function DocumentationChecklist({ items }: DocumentationChecklistProps) {
  const { methods } = useTransactionForm()
  const { control, formState } = methods
  const errors = formState.errors as FieldErrors<TransactionFormValues>

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>Documentary Compliance</Label>
        <span className="text-xs text-muted-foreground">Select all that apply</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Controller
            key={item.name}
            name={`service_specific_data.documentaryCompliance.${item.name}` as const}
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/60">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>{item.label}</span>
              </label>
            )}
          />
        ))}
      </div>
      {errors?.service_specific_data && (
        <p className="text-xs text-destructive">Please complete all documentary compliance items.</p>
      )}
    </div>
  )
}
