import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  subtitle?: string
  alertText?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  subtitle,
  alertText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop filter blur with rgba background */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[2000] bg-black/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[2001] w-[calc(100%-32px)] max-w-[400px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-2xl border border-border p-6 focus:outline-none animate-resultModalPop">
          
          {/* Icon + Heading Row */}
          <div className="flex gap-4 items-start mb-6">
            {/* Warning icon container */}
            <div 
              className="w-12 h-12 rounded-lg border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: '#FFF7ED',
                borderColor: '#FFEDD5',
                color: '#EA580C',
              }}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title 
                className="font-medium text-[1.35rem] leading-7"
                style={{ 
                  fontFamily: "'DM Serif Display', Georgia, serif", 
                  color: '#0F172A' 
                }}
              >
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Body Text */}
          {message && (
            <DialogPrimitive.Description className="text-[13.5px] text-[#64748B] leading-relaxed mb-4">
              {message}
            </DialogPrimitive.Description>
          )}

          {/* Optional 'Success' Alert block */}
          {alertText && (
            <div 
              className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border"
              style={{
                backgroundColor: '#F0FDF4',
                color: '#166534',
                borderColor: '#BBF7D0',
              }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#166534]" />
              <span className="font-semibold">{alertText}</span>
            </div>
          )}

          {/* Actions Section */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (onCancel) onCancel()
                onOpenChange(false)
              }}
              className="h-10 px-4 font-semibold text-sm"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className="h-10 px-4 font-semibold text-sm bg-[#580000] text-white hover:bg-[#7a0c0c]"
            >
              {confirmText}
            </Button>
          </div>

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
