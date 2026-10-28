"use client";

import React from "react";
import {
  UnsupportedFeatureBanner,
  UnsupportedReasonCategory,
} from "./unsupported-feature-banner";
import { useBrowserCapabilities, BrowserFeature } from "../../hooks/use-browser-capabilities";

export interface FeatureGuardProps {
  children: React.ReactNode;
  /**
   * If false, the feature is marked as disabled/unsupported.
   */
  enabled?: boolean;
  /**
   * The reason category for unavailability.
   */
  reason?: UnsupportedReasonCategory;
  /**
   * Name of feature (e.g. "Voice Note Recording", "SMS Broadcast")
   */
  featureName?: string;
  /**
   * Required browser API (e.g. "camera", "speechRecognition", "geolocation")
   */
  requiresBrowserApi?: BrowserFeature;
  /**
   * Custom message explaining the state.
   */
  message?: string;
  /**
   * Required subscription plan name (e.g. "Enterprise")
   */
  requiredPlan?: string;
  /**
   * Fallback node if custom fallback is preferred over default banner.
   */
  fallback?: React.ReactNode;
  /**
   * If true, renders a inline compact alert banner instead of a full box.
   */
  compact?: boolean;
  /**
   * Optional retry handler.
   */
  onRetry?: () => void;
  /**
   * Optional back handler.
   */
  onBack?: () => void;
}

export function FeatureGuard({
  children,
  enabled = true,
  reason,
  featureName,
  requiresBrowserApi,
  message,
  requiredPlan,
  fallback,
  compact = false,
  onRetry,
  onBack,
}: FeatureGuardProps) {
  const { checkCapability } = useBrowserCapabilities();

  // 1. Check browser capability if specified
  if (requiresBrowserApi) {
    const browserCheck = checkCapability(requiresBrowserApi);
    if (!browserCheck.supported) {
      if (fallback) return <>{fallback}</>;
      return (
        <UnsupportedFeatureBanner
          reason="BROWSER_UNSUPPORTED"
          featureName={featureName}
          message={message || browserCheck.message || undefined}
          compact={compact}
          onRetry={onRetry}
          onBack={onBack}
        />
      );
    }
  }

  // 2. Check explicitly provided enabled flag
  if (!enabled) {
    if (fallback) return <>{fallback}</>;
    return (
      <UnsupportedFeatureBanner
        reason={reason || "NOT_IMPLEMENTED"}
        featureName={featureName}
        message={message}
        requiredPlan={requiredPlan}
        compact={compact}
        onRetry={onRetry}
        onBack={onBack}
      />
    );
  }

  return <>{children}</>;
}
