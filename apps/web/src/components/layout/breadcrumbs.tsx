"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  if (pathSegments.length === 0) return null;

  const homeHref = pathname.startsWith("/super-admin")
    ? "/super-admin"
    : pathname.startsWith("/teacher")
    ? "/teacher/dashboard"
    : pathname.startsWith("/student")
    ? "/student/dashboard"
    : pathname.startsWith("/parent")
    ? "/parent/dashboard"
    : pathname.startsWith("/accountant")
    ? "/accountant/dashboard"
    : pathname.startsWith("/librarian")
    ? "/librarian/dashboard"
    : pathname.startsWith("/receptionist")
    ? "/receptionist/dashboard"
    : "/dashboard";

  return (
    <nav
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-semibold text-warm-500"
      aria-label="Breadcrumb"
    >
      <Link
        href={homeHref}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-sage-100 hover:text-forest-800"
      >
        <Home size={13} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pathSegments.length - 1;
        const label = formatLabel(segment);

        return (
          <React.Fragment key={href}>
            <ChevronRight size={12} className="text-warm-300 shrink-0" />
            {isLast ? (
              <span
                aria-current="page"
                className="max-w-[180px] truncate rounded-md bg-warm-100 px-1.5 py-1 font-bold text-forest-900"
              >
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="truncate max-w-[140px] rounded-md px-1.5 py-1 transition-colors hover:bg-sage-100 hover:text-forest-800"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function formatLabel(segment: string): string {
  if (segment.length > 20 && segment.includes("-")) {
    return "Details";
  }

  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
