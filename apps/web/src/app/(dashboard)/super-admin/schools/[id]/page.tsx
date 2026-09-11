'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  ChevronLeft,
  ShieldCheck,
  CreditCard,
  Users,
  AlertTriangle,
  Activity,
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    setLoading(true);
    try {
      const data = await apiFetch(`/super-admin/schools/${id}`);
      setSchool(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      await apiFetch(`/super-admin/schools/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadDetail();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;
  if (!school) return <div className="p-20 text-center text-red-500 font-bold uppercase">School not found</div>;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
             <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{school.name}</h1>
                <StatusBadge status={school.status} />
             </div>
             <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">{school.code} • {school.slug}</p>
          </div>
        </div>
        <div className="flex gap-3">
           {school.status === 'ACTIVE' ? (
             <button onClick={() => handleStatusChange('SUSPENDED')} className="bg-orange-50 text-orange-700 px-6 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition-all flex items-center gap-2">
                <AlertTriangle size={18} /> Suspend School
             </button>
           ) : (
             <button onClick={() => handleStatusChange('ACTIVE')} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-200">
                <ShieldCheck size={18} /> Reactivate School
             </button>
           )}
           <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg">
             <ExternalLink size={18} /> Login as School Admin
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Info */}
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <MiniStat label="Students" value={school._count.students} icon={<Users size={16}/>} />
              <MiniStat label="Teachers" value={school._count.teachers} icon={<Users size={16}/>} />
              <MiniStat label="Staff" value={school._count.staff} icon={<Users size={16}/>} />
           </div>

           <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2"><CreditCard className="text-blue-600" /> Subscription & Billing</h3>
              {school.subscription ? (
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Plan</p>
                      <p className="text-2xl font-black text-gray-900">{school.subscription.plan.name}</p>
                      <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit">
                        {school.subscription.pricing.interval} • {school.subscription.pricing.amount} {school.subscription.pricing.currency}
                      </p>
                   </div>
                   <div className="space-y-4">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Renewal</p>
                      <div className="flex items-center gap-2">
                         <Calendar className="text-gray-400" size={20} />
                         <p className="text-xl font-black text-gray-800">{new Date(school.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-400">Status: {school.subscription.status}</span>
                   </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 font-bold">No active subscription found</p>
                   <button className="mt-4 text-blue-600 font-black text-sm uppercase tracking-widest">+ Grant Access</button>
                </div>
              )}
           </div>

           <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2"><Activity className="text-blue-600" /> Recent Usage</h3>
              <div className="space-y-4">
                 {school.usageLogs.map((log: any) => (
                   <div key={log.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div>
                         <p className="text-sm font-black text-gray-800">{log.channel} Messaging</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(log.billingPeriodStart).toLocaleDateString()} - {new Date(log.billingPeriodEnd).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-blue-600">{log.successfulCount} Successful</p>
                         <p className="text-[10px] font-bold text-red-400 uppercase">{log.failedCount} Failed</p>
                      </div>
                   </div>
                 ))}
                 {school.usageLogs.length === 0 && <p className="text-center text-gray-400 py-4 italic">No recent usage recorded</p>}
              </div>
           </div>
        </div>

        {/* Right Column: Contact & Admin */}
        <div className="space-y-8">
           <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">School Administrators</h3>
              <div className="space-y-4">
                 {school.memberships.filter((m: any) => m.status === 'ACTIVE').map((m: any) => (
                   <div key={m.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                        {m.user.firstName[0]}
                      </div>
                      <div>
                         <p className="text-sm font-black text-gray-900 leading-tight">{m.user.firstName} {m.user.lastName}</p>
                         <p className="text-xs text-gray-400 font-medium truncate">{m.user.email}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                 <ContactItem label="Phone" value={school.phone || 'Not provided'} />
                 <ContactItem label="Email" value={school.email || 'Not provided'} />
                 <ContactItem label="Address" value={school.address || 'Not provided'} />
                 <ContactItem label="Timezone" value={school.timezone} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
       <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="text-blue-600 opacity-30">{icon}</div>
       </div>
       <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function ContactItem({ label, value }: any) {
  return (
    <div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
       <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    ACTIVE: 'bg-green-100 text-green-700',
    TRIAL: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    EXPIRED: 'bg-red-100 text-red-700',
    DEACTIVATED: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles[status] || styles.ACTIVE}`}>
      {status}
    </span>
  );
}
