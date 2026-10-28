"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, badge, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-3 border-b border-warm-200 pb-5 sm:mb-7">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1.5">
          {badge && (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
              {badge}
            </p>
          )}
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-charcoal-950 sm:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-xs leading-relaxed text-warm-600 sm:text-[13px]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="pt-1">{children}</div>}
    </div>
  );
}
