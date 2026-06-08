/**
 * Modal Component - Web
 * Dialog overlay for focused interactions
 * Features: backdrop click, ESC key close, focus trap, animations
 */

import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeButton?: boolean;
}

/**
 * Modal Component
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   <p>Are you sure?</p>
 *   <Button onClick={handleConfirm}>Confirm</Button>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeButton = true,
}) => {
  // TODO: Implement
  // - Portal rendering (ReactDOM.createPortal)
  // - Focus trap using focus-visible library
  // - Animate backdrop and modal
  // - Support ESC key to close
  // - Prevent scroll on document when open
  // - Support custom footer actions
  // - Apply theme-specific styles
  // - Accessibility: role="dialog", aria-modal, etc.

  useEffect(() => {
    if (isOpen) {
      // Prevent scroll
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeMap = {
    sm: "w-96",
    md: "w-[500px]",
    lg: "w-[700px]",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`bg-surface rounded-lg shadow-2xl max-h-[90vh] overflow-auto ${sizeMap[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          {title && <h2 className="text-xl font-bold text-text-primary">{title}</h2>}
          {closeButton && (
            <button
              onClick={onClose}
              className="ml-auto text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && <div className="flex gap-3 p-6 border-t border-neutral-200">{footer}</div>}
      </div>
    </div>
  );
};

Modal.displayName = "Modal";