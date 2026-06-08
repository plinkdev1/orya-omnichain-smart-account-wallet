/**
 * Toast Component - Web
 * Transient notifications for user feedback
 * Features: auto-dismiss, dismissible, variants (success, error, warning, info)
 */

import React, { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast Component
 * @example
 * <Toast message="Operation completed!" variant="success" duration={3000} />
 */
export const Toast: React.FC<ToastProps> = ({
  id = Math.random().toString(36).substr(2, 9),
  message,
  variant = "info",
  duration = 3000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  // TODO: Implement
  // - Portal rendering for toast stack
  // - Auto-dismiss after duration
  // - Animate in/out
  // - Support action button
  // - Apply theme-specific colors per variant
  // - Accessible announcements (aria-live)
  // - Z-index management for multiple toasts

  const variantStyles = {
    success: "bg-success text-white",
    error: "bg-error text-white",
    warning: "bg-warning text-white",
    info: "bg-info text-white",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${variantStyles[variant]} animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      <span className="flex-shrink-0 font-bold">{icons[variant]}</span>
      <p className="flex-1">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex-shrink-0 font-medium hover:opacity-80 transition-opacity"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

Toast.displayName = "Toast";