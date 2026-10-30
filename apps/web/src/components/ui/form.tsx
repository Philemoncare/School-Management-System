import React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared form layout primitives. Every create/edit form uses these so headings,
 * spacing, grids and action bars stay consistent across modules.
 */

export function FormSection({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 border-t border-warm-100 pt-6 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-warm-600">
          {icon}
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-warm-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function FormGrid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-warm-100 pt-4 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700"
    >
      {message}
    </div>
  );
}

export function FormNotice({
  tone = "warning",
  title,
  children,
}: {
  tone?: "warning" | "info";
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm",
        tone === "warning"
          ? "border-warning-200 bg-warning-50 text-warning-800"
          : "border-forest-200 bg-forest-50 text-forest-900",
      )}
    >
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-xs">{children}</div>}
    </div>
  );
}
