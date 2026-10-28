"use client";

import React from "react";
import { X, AlertTriangle, Lock, Settings, Sparkles, ShieldAlert } from "lucide-react";
import { UnsupportedReasonCategory } from "./unsupported-feature-banner";

export interface UnsupportedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: UnsupportedReasonCategory;
  featureName?: string;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function UnsupportedFeatureModal({
  isOpen,
  onClose,
  reason = "NOT_IMPLEMENTED",
  featureName,
  title,
  message,
  onRetry,
}: UnsupportedFeatureModalProps) {
  if (!isOpen) return null;

  const getModalIcon = () => {
    switch (reason) {
      case "PLAN_RESTRICTED":
        return <Lock className="h-8 w-8 text-purple-600" />;
      case "SERVICE_UNCONFIGURED":
        return <Settings className="h-8 w-8 text-blue-600" />;
      case "PERMISSION_DENIED":
        return <ShieldAlert className="h-8 w-8 text-red-600" />;
      case "SERVICE_UNAVAILABLE":
        return <AlertTriangle className="h-8 w-8 text-amber-600" />;
      default:
        return <Sparkles className="h-8 w-8 text-amber-500" />;
    }
  };

  const getDisplayTitle = () => {
    if (title) return title;
    if (featureName) return `'${featureName}' Feature Unavailable`;
    switch (reason) {
      case "PLAN_RESTRICTED":
        return "Subscription Upgrade Required";
      case "SERVICE_UNCONFIGURED":
        return "Integration Not Configured";
      case "PERMISSION_DENIED":
        return "Permission Denied";
      case "SERVICE_UNAVAILABLE":
        return "Service Temporarily Unavailable";
      default:
        return "Feature Not Available Yet";
    }
  };

  const getDisplayMessage = () => {
    if (message) return message;
    switch (reason) {
      case "PLAN_RESTRICTED":
        return "This feature is not included in your school's current plan. Please contact your school administrator to upgrade.";
      case "SERVICE_UNCONFIGURED":
        return "This integration service has not been configured yet. Contact your administrator to complete the integration setup.";
      case "PERMISSION_DENIED":
        return "Your user role does not have permission to execute this operation.";
      case "SERVICE_UNAVAILABLE":
        return "The backend service for this feature is currently offline or unreachable. Please try again shortly.";
      default:
        return "This feature is currently under development for SchooMA. Please check back in a future update.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border dark:border-gray-800">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            {getModalIcon()}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {getDisplayTitle()}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {getDisplayMessage()}
          </p>

          <div className="flex w-full flex-col sm:flex-row gap-2 pt-4">
            {onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose();
                }}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Understand & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
