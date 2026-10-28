"use client";

import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "link" | "destructive";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  isLoading,
  leftIcon,
  rightIcon,
  onClick,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex touch-manipulation select-none items-center justify-center rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

  const variantStyles = {
    primary: "bg-forest-800 text-ivory-50 shadow-xs hover:bg-forest-900",
    secondary: "bg-sage-100 text-forest-900 hover:bg-sage-200",
    outline: "border border-warm-300 bg-card text-charcoal-800 shadow-xs hover:border-warm-400 hover:bg-warm-50",
    ghost: "text-warm-700 hover:bg-warm-100 hover:text-forest-900",
    danger: "bg-danger-600 text-white shadow-xs hover:bg-danger-700",
    destructive: "bg-danger-600 text-white shadow-xs hover:bg-danger-700",
    success: "bg-success-600 text-white shadow-xs hover:bg-success-700",
    link: "h-auto min-h-0 p-0 text-forest-700 underline-offset-4 hover:underline",
  }[variant];

  const sizeStyles = {
    xs: "h-8 min-h-[32px] gap-1.5 px-3 text-xs",
    sm: "h-9 min-h-[36px] gap-2 px-3.5 text-xs sm:text-sm",
    md: "h-10 min-h-[40px] gap-2 px-4 text-sm",
    lg: "h-11 min-h-[44px] gap-2 px-5 text-sm sm:text-[15px]",
    icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
  }[size];

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
