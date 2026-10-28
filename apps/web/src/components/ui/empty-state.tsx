"use client";

import React, { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionButton?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, actionButton, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center border border-dashed border-warm-300 bg-card rounded-2xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-xs ${className}`}>
      <div className="p-4 bg-sage-100 text-forest-600 rounded-2xl mb-4 select-none">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-bold text-charcoal-900 tracking-tight mb-1">{title}</h4>
      <p className="text-xs md:text-sm font-medium text-warm-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionButton}
    </div>
  );
}
