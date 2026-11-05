"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "success" | "warning" | "error" | "neutral" | "brand" | "outline" | "secondary" | "destructive";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    default: "bg-forest-700 text-ivory-100 border-transparent",
    info: "bg-sage-100 text-forest-800 border-sage-300",
    success: "bg-success-50 text-success-700 border-success-200",
    warning: "bg-warning-50 text-warning-800 border-warning-200",
    error: "bg-danger-50 text-danger-700 border-danger-200",
    neutral: "bg-warm-100 text-warm-700 border-warm-200",
    brand: "bg-forest-800 text-ivory-100 border-transparent",
    outline: "bg-transparent text-charcoal-800 border-warm-300",
    secondary: "bg-sage-200 text-forest-900 border-transparent",
    destructive: "bg-danger-600 text-white border-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
