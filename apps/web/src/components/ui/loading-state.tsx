"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-lg h-4 w-full", className)} />;
}

export function SkeletonCircle({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-full h-10 w-10 shrink-0", className)} />;
}

export function LoadingSpinner({ label = "Loading data stream..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-center select-none animate-in fade-in duration-500">
      <div className="h-12 w-12 rounded-2xl border-2 border-forest-700 border-t-terracotta-500 animate-spin" />
      <p className="text-[11px] font-bold tracking-wide uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full border border-border rounded-2xl p-6 bg-card space-y-6 shadow-sm">
      <div className="flex justify-between items-center pb-2">
        <SkeletonLine className="w-1/4 h-6" />
        <SkeletonLine className="w-20 h-9 rounded-xl" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-6 items-center py-4 border-b border-border/50 last:border-0">
            <SkeletonLine className="w-1/3 h-4" />
            <SkeletonLine className="w-1/4 h-4" />
            <SkeletonLine className="w-1/6 h-4" />
            <SkeletonLine className="w-12 h-4 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
