"use client";

import React, { useState } from "react";
import { HelpCircle, Lock, AlertCircle } from "lucide-react";
import { UnsupportedReasonCategory } from "./unsupported-feature-banner";

export interface DisabledFeatureButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  enabled?: boolean;
  reason?: UnsupportedReasonCategory;
  disabledReasonMessage?: string;
  featureName?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
}

export function DisabledFeatureButton({
  enabled = true,
  reason = "SERVICE_UNCONFIGURED",
  disabledReasonMessage,
  featureName,
  icon: Icon,
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled,
  ...props
}: DisabledFeatureButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isButtonDisabled = disabled || !enabled;

  const getReasonText = (): string => {
    if (disabledReasonMessage) return disabledReasonMessage;
    switch (reason) {
      case "SERVICE_UNCONFIGURED":
        return `Service not configured. Contact your administrator.`;
      case "PLAN_RESTRICTED":
        return `Requires plan upgrade. Contact your administrator.`;
      case "PERMISSION_DENIED":
        return `You do not have permission for this action.`;
      case "NOT_IMPLEMENTED":
        return `This feature is not available yet.`;
      case "BROWSER_UNSUPPORTED":
        return `Your browser does not support this action.`;
      default:
        return `Feature unavailable.`;
    }
  };

  const getVariantStyles = (): string => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500";
      case "secondary":
        return "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500";
      case "outline":
        return "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:disabled:border-gray-800 dark:disabled:text-gray-600";
      case "danger":
        return "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500";
      case "ghost":
        return "text-gray-700 hover:bg-gray-100 disabled:text-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:disabled:text-gray-600";
      default:
        return "";
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        {...props}
        disabled={isButtonDisabled}
        onClick={(e) => {
          if (isButtonDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-disabled={isButtonDisabled}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${getVariantStyles()} ${className}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {children}
        {isButtonDisabled && reason === "PLAN_RESTRICTED" && (
          <Lock className="h-3.5 w-3.5 text-purple-500 shrink-0" />
        )}
        {isButtonDisabled && reason === "SERVICE_UNCONFIGURED" && (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
      </button>

      {isButtonDisabled && showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-normal rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-800 max-w-xs text-center border border-gray-700"
        >
          {getReasonText()}
          <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
