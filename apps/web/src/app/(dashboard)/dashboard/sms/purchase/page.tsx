'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { CreditCard, Smartphone, ArrowRight, Loader2, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SmsPackage {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  isFeatured: boolean;
  displayOrder: number;
}

export default function SmsPurchasePage() {
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pkgs, purch] = await Promise.all([
        apiFetch('/school/sms/packages'),
        apiFetch('/school/sms/purchases'),
      ]);
      setPackages(pkgs || []);
      setPurchases(purch || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load SMS packages');
    } finally {
      setLoading(false);
    }
  }

  async function purchaseCredits() {
    if (!selectedPackage) return;
    setPurchasing(selectedPackage);
    setError('');
    try {
      const result = await apiFetch('/school/sms/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId: selectedPackage }),
      });
      setPurchaseResult(result);
      setSelectedPackage(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to purchase SMS credits');
    } finally {
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <Loader2 className="mx-auto animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-6 py-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      </div>
    );
  }

  if (purchaseResult) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-forest-700" />
        </div>
        <h2 className="text-xl font-semibold text-charcoal-900">Request submitted</h2>
        <p className="mt-2 max-w-md text-warm-500">
          Your request for{' '}
          <strong className="text-charcoal-900">{purchaseResult.credits} SMS credits</strong> was
          recorded as <strong className="text-charcoal-900">{purchaseResult.status}</strong>. No
          credits have been added to your balance yet - they are delivered only after the platform
          confirms the payment.
        </p>
        <p className="mt-2 text-xs text-warm-400">
          Track this request in the purchase history below.
        </p>
        <Button
          onClick={() => {
            setPurchaseResult(null);
          }}
          className="mt-6"
        >
          Back to Packages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
          Purchase SMS Credits
        </h1>
        <p className="mt-1 text-warm-500 font-medium">
          Select an SMS package to add credits to your school balance.
        </p>
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-xs font-semibold text-warm-400">
              No SMS packages are currently available. Please contact your platform
              administrator.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {packages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          return (
            <Card
              key={pkg.id}
              className={`
                transition-all hover:shadow-md
                ${isSelected ? 'border-forest-700 bg-forest-50' : 'border-warm-200'}
              `}
            >
              <CardContent className="p-6 sm:p-8">
                {pkg.isFeatured && (
                  <Badge className="mb-3 text-[10px] bg-terracotta-100 text-terracotta-800">
                    Featured
                  </Badge>
                )}
                <h3 className="font-semibold text-charcoal-900">{pkg.name}</h3>
                <p className="mt-1 text-sm text-warm-500">
                  {pkg.description || 'SMS credit package'}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-charcoal-900">
                      {pkg.credits}
                    </span>
                    <span className="text-warm-500 font-medium">credits</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-charcoal-800">
                      {pkg.currency} {pkg.price}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (isSelected) setSelectedPackage(null);
                    else setSelectedPackage(pkg.id);
                  }}
                  disabled={purchasing === pkg.id}
                  className={`w-full ${
                    isSelected
                      ? 'bg-forest-700 hover:bg-forest-800 text-white'
                      : 'bg-white border border-warm-200 hover:bg-warm-50 text-warm-700'
                  }`}
                >
                  {isSelected ? 'Select another' : 'Select package'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPackage && (
        <div className="md:col-span-2">
          <Card className="border-forest-200 bg-forest-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Confirm Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-justify-between text-sm">
                  <span className="text-warm-500">Package</span>
                  <span className="font-semibold text-charcoal-900">
                    {packages.find((p) => p.id === selectedPackage)?.name}
                  </span>
                </div>
                <div className="flex items-justify-between text-sm">
                  <span className="text-warm-500">Credits</span>
                  <span className="font-semibold text-charcoal-900">
                    +{packages.find((p) => p.id === selectedPackage)?.credits}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-2 border-t border-warm-200">
                  <span className="text-warm-500">Total</span>
                  <span className="text-lg font-bold text-charcoal-900">
                    {packages.find((p) => p.id === selectedPackage)?.currency}{' '}
                    {packages.find((p) => p.id === selectedPackage)?.price}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={purchaseCredits}
                  disabled={purchasing === selectedPackage}
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-auto"
                >
                  {purchasing === selectedPackage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Purchase Credits'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPackage(null)}
                  className="w-auto"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hourglass className="w-5 h-5" /> Credit requests and grants
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {purchases.length === 0 ? (
            <p className="text-sm text-warm-400">
              No SMS credits have been requested for this school yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200 text-left">
                <thead>
                  <tr>
                    <th className="pb-3 text-[11px] font-semibold uppercase text-warm-400">Package</th>
                    <th className="pb-3 text-right text-[11px] font-semibold uppercase text-warm-400">Credits</th>
                    <th className="pb-3 text-right text-[11px] font-semibold uppercase text-warm-400">Value</th>
                    <th className="pb-3 text-[11px] font-semibold uppercase text-warm-400">Requested</th>
                    <th className="pb-3 text-[11px] font-semibold uppercase text-warm-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {purchases.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 text-xs font-semibold text-charcoal-900">
                        {row.package?.name || row.packageId}
                      </td>
                      <td className="py-3 text-right text-xs text-charcoal-900">{row.credits}</td>
                      <td className="py-3 text-right text-xs text-charcoal-900">
                        {row.currency} {Number(row.amount).toFixed(2)}
                      </td>
                      <td className="py-3 text-xs text-warm-500">
                        {new Date(row.purchasedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={row.status === 'COMPLETED' ? 'success' : 'outline'}
                          className="text-[10px] font-semibold"
                        >
                          {row.status === 'PENDING'
                            ? 'Awaiting payment confirmation'
                            : row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[11px] text-warm-400">
                Credits appear on your balance page only after a request is confirmed. Requests
                cannot be confirmed from this screen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
