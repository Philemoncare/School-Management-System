"use client";

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerActions?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, footerActions, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/55 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className={`z-10 flex max-h-[90vh] w-full ${sizeClasses} flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-panel animate-in fade-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border select-none shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-accent transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] text-xs sm:text-sm text-foreground/90 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footerActions && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/40 border-t border-border shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
}
