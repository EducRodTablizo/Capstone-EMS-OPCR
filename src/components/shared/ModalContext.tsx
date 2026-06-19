import React, { createContext, useContext, useState } from 'react'
import { ConfirmModal } from './ConfirmModal'
import { ResultModal } from './ResultModal'

export interface ConfirmOptions {
  title: string
  message: string
  alertText?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export interface ResultOptions {
  type: 'success' | 'error' | 'next'
  title?: string
  message: string
  buttonText?: string
  onConfirm?: () => void
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => void
  showResult: (options: ResultOptions) => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null)

  const [resultOpen, setResultOpen] = useState(false)
  const [resultOptions, setResultOptions] = useState<ResultOptions | null>(null)

  const confirm = (options: ConfirmOptions) => {
    setConfirmOptions(options)
    setConfirmOpen(true)
  }

  const showResult = (options: ResultOptions) => {
    setResultOptions(options)
    setResultOpen(true)
  }

  const handleConfirm = async () => {
    if (confirmOptions) {
      await confirmOptions.onConfirm()
    }
  }

  return (
    <ModalContext.Provider value={{ confirm, showResult }}>
      {children}

      {confirmOptions && (
        <ConfirmModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={confirmOptions.title}
          message={confirmOptions.message}
          alertText={confirmOptions.alertText}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
          onConfirm={handleConfirm}
          onCancel={confirmOptions.onCancel}
        />
      )}

      {resultOptions && (
        <ResultModal
          open={resultOpen}
          onOpenChange={setResultOpen}
          type={resultOptions.type}
          title={resultOptions.title}
          message={resultOptions.message}
          buttonText={resultOptions.buttonText}
          onConfirm={resultOptions.onConfirm}
        />
      )}
    </ModalContext.Provider>
  )
}

export function useModals() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModals must be used within a ModalProvider')
  }
  return context
}
