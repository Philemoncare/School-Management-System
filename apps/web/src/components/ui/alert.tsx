"use client";

import React, { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ type = "info", title, children, className = "" }: AlertProps) {
  const styles = {
    info: {
      wrapper: "bg-sage-50 border-sage-300 text-forest-900",
      icon: <Info className="w-5 h-5 text-forest-600 shrink-0" />,
    },
    success: {
      wrapper: "bg-success-50 border-success-200 text-success-800",
      icon: <CheckCircle className="w-5 h-5 text-success-600 shrink-0" />,
    },
    warning: {
      wrapper: "bg-warning-50 border-warning-200 text-warning-800",
      icon: <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0" />,
    },
    error: {
      wrapper: "bg-danger-50 border-danger-200 text-danger-800",
      icon: <AlertCircle className="w-5 h-5 text-danger-600 shrink-0" />,
    },
  }[type];

  return (
    <div className={`flex gap-3 rounded-lg border p-3.5 text-sm leading-relaxed ${styles.wrapper} ${className}`}>
      {styles.icon}
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && <h5 className="text-sm font-semibold tracking-tight">{title}</h5>}
        <div className="text-xs font-medium leading-relaxed opacity-90 md:text-[13px]">{children}</div>
      </div>
    </div>
  );
}
