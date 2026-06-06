import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react'
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Service } from '@/types'
import { getServiceConfigByName, type ServiceConfig } from '@/config/serviceConfig'
import type { TransactionFormValues } from './transactionTypes'

interface TransactionFormContextValue {
  methods: UseFormReturn<TransactionFormValues>
  selectedService?: Service
  selectedServiceConfig?: ServiceConfig
}

const TransactionFormContext = createContext<TransactionFormContextValue | null>(null)

interface TransactionFormProviderProps {
  services: Service[]
  defaultValues: TransactionFormValues
  open: boolean
  children: ReactNode
}

const studentNumberRegex = /^\d{4}-\d{5}-CM-0$/
const contactNumberRegex = /^(?:\+63\d{10}|09\d{9})$/

const baseFormSchema = z.object({
  service_id: z.string().min(1, 'Service is required'),
  assigned_to: z.string(),
  client_type: z.enum(['Student', 'Visitor', 'Organization']),
  client_name: z.string().optional(),
  client_first_name: z.string().trim().min(1, 'First name is required'),
  client_middle_name: z.string().optional(),
  client_surname: z.string().trim().min(1, 'Surname is required'),
  student_number: z.string(),
  course: z.string(),
  year_level: z.string(),
  contact_number: z.string().trim().min(1, 'Contact number is required').regex(contactNumberRegex, 'Contact number must be 09XXXXXXXXX'),
  organization: z.string(),
  remarks: z.string().max(255, 'Remarks cannot exceed 255 characters'),
  service_specific_data: z.any().optional(),
})

function buildServiceSpecificSchema(serviceConfig?: ServiceConfig) {
  if (!serviceConfig) {
    return z.any().optional()
  }

  const fields: Record<string, z.ZodTypeAny> = {}

  serviceConfig.fields.forEach((field) => {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'date':
        fields[field.name] = field.required
          ? z.string().trim().min(1, `${field.label} is required`)
          : z.string()
        break
      case 'number': {
        const numberSchema = z.preprocess((value) => {
          if (typeof value === 'string' && value.trim() === '') return undefined
          if (typeof value === 'string') return Number(value)
          return value
        }, z.number())

        fields[field.name] = field.required
          ? numberSchema.refine((value) => typeof value === 'number' && !Number.isNaN(value), {
              message: `${field.label} is required`,
            })
          : numberSchema.optional()
        break
      }
      case 'select':
        fields[field.name] = field.required
          ? z.string().trim().min(1, `${field.label} is required`)
          : z.string()
        break
      default:
        fields[field.name] = z.string()
    }
  })

  if (serviceConfig.documentation?.length) {
    const documentaryShape: Record<string, z.ZodTypeAny> = {}
    serviceConfig.documentation.forEach((item) => {
      documentaryShape[item.name] = z.boolean().refine((value) => value === true, `${item.label} is required`)
    })

    fields.documentaryCompliance = z.object(documentaryShape)
  }

  return z.object(fields)
}

function getValidationSchema(serviceConfig?: ServiceConfig) {
  let schema: any = baseFormSchema.extend({
    service_specific_data: buildServiceSpecificSchema(serviceConfig),
  })

  if (serviceConfig?.clientRequirements?.studentNumber) {
    schema = schema.extend({
      student_number: z.string().trim().min(1, 'Student number is required'),
    })
  }

  if (serviceConfig?.clientRequirements?.course) {
    schema = schema.extend({
      course: z.string().trim().min(1, 'Course / Program is required'),
    })
  }

  if (serviceConfig?.clientRequirements?.yearLevel) {
    schema = schema.extend({
      year_level: z.string().trim().min(1, 'Year level is required'),
    })
  }

  return schema.superRefine((data: any, ctx: z.RefinementCtx) => {
    if (data.student_number?.trim() && !studentNumberRegex.test(data.student_number.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Student number must follow YYYY-XXXXX-CM-0',
        path: ['student_number'],
      })
    }

    if (data.client_type === 'Organization' && !data.organization?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organization / Institution is required for organization clients',
        path: ['organization'],
      })
    }
  })
}

export function TransactionFormProvider({ services, defaultValues, open, children }: TransactionFormProviderProps) {
  const methods = useForm<TransactionFormValues>({
    defaultValues,
    mode: 'all',
    shouldUnregister: false,
    resolver: async (values, context, options) => {
      const serviceId = values.service_id
      const selectedService = services.find((service) => service.id === serviceId)
      const selectedServiceConfig = selectedService ? getServiceConfigByName(selectedService.name) : undefined
      const schema = getValidationSchema(selectedServiceConfig)
      return zodResolver(schema)(values as any, context as any, options as any) as any
    },
  })

  const serviceId = methods.watch('service_id')

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  )

  const selectedServiceConfig = useMemo(
    () => selectedService ? getServiceConfigByName(selectedService.name) : undefined,
    [selectedService],
  )

  useEffect(() => {
    if (!open) {
      methods.reset(defaultValues)
    }
  }, [defaultValues, methods, open])

  return (
    <TransactionFormContext.Provider value={{ methods, selectedService, selectedServiceConfig }}>
      <FormProvider {...methods}>{children}</FormProvider>
    </TransactionFormContext.Provider>
  )
}

export function useTransactionForm() {
  const context = useContext(TransactionFormContext)
  if (!context) {
    throw new Error('useTransactionForm must be used within a TransactionFormProvider')
  }
  return context
}
