import { useState, useCallback, useEffect } from 'react'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
  open: boolean
}

let listeners: Array<(toasts: ToastItem[]) => void> = []
let toasts: ToastItem[] = []

function notify(newToasts: ToastItem[]) {
  toasts = newToasts
  listeners.forEach((l) => l(toasts))
}

export function toast(options: ToastOptions) {
  const id = String(Date.now())
  const item: ToastItem = { ...options, id, open: true }
  notify([...toasts, item])

  setTimeout(() => {
    notify(toasts.map((t) => (t.id === id ? { ...t, open: false } : t)))
    setTimeout(() => {
      notify(toasts.filter((t) => t.id !== id))
    }, 300)
  }, options.duration ?? 3500)
}

export function useToastStore() {
  const [items, setItems] = useState<ToastItem[]>(toasts)

  const listener = useCallback((newItems: ToastItem[]) => {
    setItems([...newItems])
  }, [])

  useEffect(() => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [listener])

  return items
}
