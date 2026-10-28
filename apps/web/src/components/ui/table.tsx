"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-x-auto rounded-2xl border bg-card shadow-sm scrollbar-thin", className)}>
      <table className="w-full caption-bottom text-xs sm:text-sm text-left">
        {children}
      </table>
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("w-full caption-bottom text-xs sm:text-sm text-left", className)}>{children}</table>;
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("[&_tr]:border-b bg-muted/60", className)}>{children}</thead>;
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("[&_tr]:border-b bg-muted/60", className)}>{children}</thead>;
}

export function TableHeaderCell({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("h-10 sm:h-11 px-3 sm:px-4 text-left align-middle font-bold text-muted-foreground uppercase tracking-wider text-[11px] select-none whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0 divide-y divide-border/60", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted",
        onClick && "cursor-pointer active:bg-muted/70",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 sm:px-4 py-3 align-middle font-medium text-foreground whitespace-nowrap sm:whitespace-normal", className)}
      {...props}
    >
      {children}
    </td>
  );
}
