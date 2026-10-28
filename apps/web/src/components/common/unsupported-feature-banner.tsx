"use client";

import React from "react";
import {
  AlertTriangle,
  Lock,
  Settings,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  MonitorOff,
  WifiOff,
} from "lucide-react";

export type UnsupportedReasonCategory =
  | "NOT_IMPLEMENTED"
  | "SERVICE_UNCONFIGURED"
  | "PLAN_RESTRICTED"
  | "PERMISSION_DENIED"
  | "SERVICE_UNAVAILABLE"
  | "BROWSER_UNSUPPORTED"
  | "NETWORK_ERROR";

export interface UnsupportedFeatureBannerProps {
  reason?: UnsupportedReasonCategory;
  title?: string;
  message?: string;
  featureName?: string;
  serviceName?: string;
  requiredPlan?: string;
  onRetry?: () => void;
  onBack?: () => void;
  adminContactText?: string;
  className?: string;
  compact?: boolean;
}

const DEFAULT_CONFIGS: Record<
  UnsupportedReasonCategory,
  {
    icon: React.ElementType;
    badgeColor: string;
    badgeText: string;
    defaultTitle: string;
    defaultMessage: string;
    actionText: string;
  }
> = {
  NOT_IMPLEMENTED: {
    icon: Sparkles,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40",
    badgeText: "Feature Planned",
    defaultTitle: "This feature is not available yet",
    defaultMessage: "This feature is currently under active development. Please check back later.",
    actionText: "Check Back Later",
  },
  SERVICE_UNCONFIGURED: {
    icon: Settings,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40",
    badgeText: "Service Unconfigured",
    defaultTitle: "Service configuration required",
    defaultMessage: "This service has not been configured. Please contact your school administrator.",
    actionText: "Contact Administrator",
  },
  PLAN_RESTRICTED: {
    icon: Lock,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/40",
    badgeText: "Subscription Required",
    defaultTitle: "Upgrade required for this feature",
    defaultMessage: "This feature is not included in your current subscription tier. Contact your school administrator for assistance.",
    actionText: "Upgrade Subscription Plan",
  },
  PERMISSION_DENIED: {
    icon: ShieldAlert,
    badgeColor: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/40",
    badgeText: "Access Restricted",
    defaultTitle: "Permission denied",
    defaultMessage: "You do not have permission to perform this action or access this feature.",
    actionText: "Request Permission",
  },
  SERVICE_UNAVAILABLE: {
    icon: AlertTriangle,
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/40",
    badgeText: "Temporarily Offline",
    defaultTitle: "Service temporarily unavailable",
    defaultMessage: "This service is temporarily unavailable. Please try again in a few moments.",
    actionText: "Retry Operation",
  },
  BROWSER_UNSUPPORTED: {
    icon: MonitorOff,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    badgeText: "Browser Unsupported",
    defaultTitle: "Unsupported browser capability",
    defaultMessage: "Your web browser does not support this feature. Please use a modern supported browser.",
    actionText: "Use Modern Browser",
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40",
    badgeText: "Connection Error",
    defaultTitle: "Network connection lost",
    defaultMessage: "Unable to connect to SchooMA services. Please check your network connection and try again.",
    actionText: "Retry Connection",
  },
};

export function UnsupportedFeatureBanner({
  reason = "NOT_IMPLEMENTED",
  title,
  message,
  featureName,
  serviceName,
  requiredPlan,
  onRetry,
  onBack,
  adminContactText = "Contact Administrator",
  className = "",
  compact = false,
}: UnsupportedFeatureBannerProps) {
  const config = DEFAULT_CONFIGS[reason] || DEFAULT_CONFIGS.NOT_IMPLEMENTED;
  const IconComponent = config.icon;

  const displayTitle =
    title ||
    (featureName
      ? `'${featureName}' is unavailable`
      : serviceName
      ? `${serviceName} service is unconfigured`
      : config.defaultTitle);

  const displayMessage =
    message ||
    (requiredPlan
      ? `This feature requires the ${requiredPlan} plan or higher.`
      : config.defaultMessage);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 rounded-md border p-3 text-xs sm:text-sm ${config.badgeColor} ${className}`}
        role="alert"
      >
        <IconComponent className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <span className="font-semibold">{displayTitle}: </span>
          <span>{displayMessage}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 rounded bg-white/70 px-2 py-1 font-medium hover:bg-white dark:bg-black/20 dark:hover:bg-black/40"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 ${className}`}
      role="region"
      aria-label="Unsupported feature notice"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${config.badgeColor}`}
        >
          <IconComponent className="h-6 w-6" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeColor}`}
            >
              {config.badgeText}
            </span>
            {featureName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {featureName}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayTitle}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
            {displayMessage}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" /> Go Back
              </button>
            )}

            {reason === "SERVICE_UNCONFIGURED" && (
              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                Need setup? Contact your school IT administrator.
              </span>
            )}

            {reason === "PLAN_RESTRICTED" && (
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Contact school leadership to upgrade your subscription.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
