import { useCallback } from 'react'
import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  duration?: number
}

export function useToast() {
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const duration = options?.duration ?? 3000

      switch (type) {
        case 'success':
          return toast.success(message, { duration })
        case 'error':
          return toast.error(message, { duration })
        case 'warning':
          return toast.warning(message, { duration })
        case 'info':
        default:
          return toast.info(message, { duration })
      }
    },
    []
  )

  return {
    toast: showToast,
    success: (msg: string, opts?: ToastOptions) => showToast(msg, 'success', opts),
    error: (msg: string, opts?: ToastOptions) => showToast(msg, 'error', opts),
    warning: (msg: string, opts?: ToastOptions) => showToast(msg, 'warning', opts),
    info: (msg: string, opts?: ToastOptions) => showToast(msg, 'info', opts),
  }
}