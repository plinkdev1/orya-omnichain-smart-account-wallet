import { useCallback } from 'react'
import { Sonner } from 'sonner-native'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  duration?: number
  position?: 'top' | 'bottom'
}

export function useToast() {
  const toast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const duration = options?.duration ?? 3000

      switch (type) {
        case 'success':
          return Sonner.success(message, { duration })
        case 'error':
          return Sonner.error(message, { duration })
        case 'warning':
          return Sonner.warning(message, { duration })
        case 'info':
        default:
          return Sonner.info(message, { duration })
      }
    },
    []
  )

  return {
    toast,
    success: (msg: string, opts?: ToastOptions) => toast(msg, 'success', opts),
    error: (msg: string, opts?: ToastOptions) => toast(msg, 'error', opts),
    warning: (msg: string, opts?: ToastOptions) => toast(msg, 'warning', opts),
    info: (msg: string, opts?: ToastOptions) => toast(msg, 'info', opts),
  }
}