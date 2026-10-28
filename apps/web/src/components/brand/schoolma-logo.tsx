import React from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  tone?: "forest" | "ivory";
}

export function BrandMark({ size = 40, className, tone = "forest" }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-lg",
        tone === "forest"
          ? "bg-forest-900 shadow-[0_8px_20px_-10px_rgba(16,56,45,0.7)]"
          : "bg-ivory-100 shadow-[0_8px_20px_-12px_rgba(16,56,45,0.45)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-[72%] w-[72%]" fill="none">
        <path
          d="M12.5 29.5V10.5"
          stroke={tone === "forest" ? "#F8F6F0" : "#174D3C"}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M20 31V9"
          stroke={tone === "forest" ? "#DCE8DD" : "#35664C"}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M27.5 27.5V13"
          stroke={tone === "forest" ? "#F8F6F0" : "#174D3C"}
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M10.5 27.5H29.5"
          stroke="#C66A4A"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="30.5" cy="9.5" r="2.8" fill="#C66A4A" />
      </svg>
    </span>
  );
}

interface BrandLockupProps {
  inverted?: boolean;
  compact?: boolean;
  subtitle?: string;
  className?: string;
  markSize?: number;
}

export function BrandLockup({
  inverted = false,
  compact = false,
  subtitle = "School Operations",
  className,
  markSize = 38,
}: BrandLockupProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark size={markSize} tone={inverted ? "forest" : "forest"} />
      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "font-display text-[22px] leading-none tracking-tight",
              inverted ? "text-ivory-100" : "text-charcoal-900"
            )}
          >
            SchooMA
          </span>
          <span
            className={cn(
              "mt-1 text-[8.5px] font-bold uppercase tracking-[0.22em]",
              inverted ? "text-sage-300" : "text-warm-500"
            )}
          >
            {subtitle}
          </span>
        </span>
      )}
    </span>
  );
}
