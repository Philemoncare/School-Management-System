"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api/client";

export type IntegrationService = "SMS" | "EMAIL" | "PAYMENTS" | "STORAGE" | "REDIS" | "WHATSAPP";

export interface IntegrationStatusInfo {
  service: IntegrationService;
  configured: boolean;
  provider: string;
  missingConfig: string[];
  message: string;
}

export function useFeatureStatus(serviceName?: IntegrationService) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<IntegrationStatusInfo | null>(null);
  const [allStatuses, setAllStatuses] = useState<Record<string, IntegrationStatusInfo> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = serviceName
        ? `/integrations/status?service=${serviceName}`
        : "/integrations/status";
      const response = await apiFetch(endpoint);

      if (response && response.success) {
        if (serviceName) {
          setStatus(response.data as IntegrationStatusInfo);
        } else {
          setAllStatuses(response.data as Record<string, IntegrationStatusInfo>);
        }
      } else {
        setError("Unable to retrieve feature status");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to check integration status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [serviceName]);

  return {
    loading,
    status,
    allStatuses,
    error,
    refresh: fetchStatus,
    isConfigured: serviceName ? Boolean(status?.configured) : true,
  };
}
