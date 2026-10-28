"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-xl border border-warm-200 bg-card text-card-foreground shadow-xs transition-colors duration-150",
        (hoverable || onClick) && "cursor-pointer hover:border-warm-300 hover:shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-base sm:text-lg font-bold leading-tight tracking-tight text-foreground", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs sm:text-sm text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 sm:p-6 pt-0 sm:pt-0", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center p-4 sm:p-6 pt-0 sm:pt-0", className)}>
      {children}
    </div>
  );
}
