"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import { collectUserRoles, isPlatformAdmin } from "@/lib/auth/roles";

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { user, activeSchoolId } = useAuth();

  const activeMembership = user?.memberships?.find((m: any) => m.schoolId === activeSchoolId);
  const subscription = activeMembership?.school?.subscription;

  // Simple check for now - in production this would check plan entitlements
  const hasEntitlement = subscription?.plan?.entitlements?.some((e: any) => e.feature === feature) ||
                         isPlatformAdmin(collectUserRoles(user, activeSchoolId));

  if (hasEntitlement) {
    return <>{children}</>;
  }

  return (
    fallback || (
      <div className="p-6 border border-warning-100 bg-warning-50 rounded-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
          <Lock className="text-warning-600" size={24} />
        </div>
        <h3 className="text-lg font-bold text-charcoal-900">Premium Feature</h3>
        <p className="text-sm text-warm-600 mt-1 max-w-sm">
          The <span className="font-bold">"{feature}"</span> module is not available on your current plan.
        </p>
        <Link
          href="/dashboard/subscription"
          className="mt-6 px-4 py-2 bg-forest-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-sage-200 hover:bg-forest-800 transition-all"
        >
          Upgrade Plan
        </Link>
      </div>
    )
  );
}

export function PlanRequired({ plan, children }: { plan: string; children: React.ReactNode }) {
  // Logic to check if current school plan matches or exceeds required plan
  return <>{children}</>;
}

export function UsageLimitNotice({ limit, current, label }: { limit: number; current: number; label: string }) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = current >= limit;

  if (!isNearLimit) return null;

  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 ${isAtLimit ? 'bg-danger-50 border-danger-100 text-danger-700' : 'bg-terracotta-50 border-terracotta-100 text-terracotta-700'}`}>
      <AlertCircle size={20} />
      <div className="flex-1">
        <p className="text-sm font-bold">
          {isAtLimit ? `${label} limit reached.` : `Approaching ${label} limit.`}
        </p>
        <p className="text-[11px] opacity-80 font-medium">
          {current} of {limit} used. Upgrade your plan to add more.
        </p>
      </div>
      <Link href="/dashboard/subscription" className="text-xs font-semibold uppercase tracking-wide hover:underline">
        Upgrade
      </Link>
    </div>
  );
}
