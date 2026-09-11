"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Rocket,
  ShieldCheck,
  Database,
  Globe,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LaunchReadinessPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadiness();
  }, []);

  async function loadReadiness() {
    setLoading(true);
    try {
      const res = await apiFetch('/super-admin/launch-readiness');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Rocket className="text-orange-500" /> Launch Readiness
          </h1>
          <p className="text-gray-500 font-medium mt-1">Final production certification and system health audit.</p>
        </div>
        <button onClick={loadReadiness} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-gray-900 text-white border-0 shadow-2xl rounded-[2.5rem]">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-7xl font-black">{data?.summary?.score}%</div>
            <p className="text-sm font-bold mt-4 flex items-center gap-2">
              Status: <Badge className={data?.summary?.status === 'READY' ? 'bg-green-500' : 'bg-orange-500'}>{data?.summary?.status}</Badge>
            </p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
           {data?.categories.map((cat: any) => (
             <div key={cat.name} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat.name}</p>
                   <p className="text-xs font-bold text-gray-600 mt-1">{cat.details}</p>
                </div>
                <div className={cat.status === 'PASS' ? 'text-green-500' : 'text-orange-500'}>
                   {cat.status === 'PASS' ? <CheckCircle2 /> : <AlertTriangle />}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Integrity Audit */}
      <Card className="rounded-[2.5rem]">
        <CardHeader className="border-b border-gray-50 p-8">
           <CardTitle className="text-xl font-black text-gray-900">Database Integrity Audit</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <div className="divide-y divide-gray-50">
              {data?.integrity?.issues.length === 0 ? (
                <div className="p-20 text-center text-gray-400">
                   <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="font-bold uppercase tracking-widest text-xs">No data integrity violations detected.</p>
                </div>
              ) : (
                data?.integrity?.issues.map((issue: any) => (
                  <div key={issue.type} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={20}/></div>
                        <div>
                           <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{issue.type.replace(/_/g, ' ')}</p>
                           <p className="text-xs text-gray-500 font-medium">Anomalous records found that may require manual cleanup.</p>
                        </div>
                     </div>
                     <Badge variant="destructive" className="font-black px-4 py-1 rounded-lg">{issue.count} VIOLATIONS</Badge>
                  </div>
                ))
              )}
           </div>
        </CardContent>
      </Card>

      {/* Production Blockers */}
      <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2.5rem] relative overflow-hidden">
         <div className="relative z-10">
            <h3 className="text-lg font-black text-orange-900 mb-4 flex items-center gap-2">
               <AlertTriangle /> Critical Release Blockers
            </h3>
            <ul className="space-y-3">
               <li className="flex items-center gap-2 text-sm font-bold text-orange-800">
                  <ChevronRight size={14} /> MFA implementation currently uses static verification (000000)
               </li>
               <li className="flex items-center gap-2 text-sm font-bold text-orange-800">
                  <ChevronRight size={14} /> Malware scanning provider is not yet configured (Mock active)
               </li>
               <li className="flex items-center gap-2 text-sm font-bold text-orange-800">
                  <ChevronRight size={14} /> Infrastructure storage check currently returns 'operational' bypass
               </li>
            </ul>
         </div>
         <AlertTriangle size={150} className="absolute -bottom-10 -right-10 text-orange-100/50 -rotate-12" />
      </div>
    </div>
  );
}
