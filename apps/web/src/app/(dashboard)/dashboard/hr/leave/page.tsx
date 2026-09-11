'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  Filter,
  User,
  ArrowRight
} from 'lucide-react';

export default function LeaveManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await apiFetch('/hr/leave/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessing(id);
    try {
      await apiFetch(`/hr/leave/requests/${id}/${action}`, { method: 'POST' });
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to process request');
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Leave Management</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Review, authorize and audit employee absence requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Pending Approval" value={requests.filter(r => r.status === 'PENDING_APPROVAL').length} color="text-amber-600 bg-amber-50" icon={<Clock size={20}/>} />
        <StatCard label="Approved This Month" value={requests.filter(r => r.status === 'APPROVED').length} color="text-green-600 bg-green-50" icon={<CheckCircle size={20}/>} />
        <StatCard label="Active Absences" value={0} color="text-blue-600 bg-blue-50" icon={<Calendar size={20}/>} />
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Incoming Absence Requests</h3>
           <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                <Filter size={14}/> Filter Requests
              </button>
           </div>
        </div>

        <div className="relative min-h-[300px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                   <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type & Duration</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Decision</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                   {requests.map((req) => (
                     <tr key={req.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-black text-[10px]">
                                 {(req.staff || req.teacher).firstName[0]}{(req.staff || req.teacher).lastName[0]}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-gray-900">{(req.staff || req.teacher).firstName} {(req.staff || req.teacher).lastName}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{(req.staff || req.teacher).employeeId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-xs font-bold text-gray-700">{req.leaveType.name}</p>
                           <p className="text-[9px] font-black text-blue-600 uppercase mt-0.5 flex items-center gap-1">
                              {new Date(req.startDate).toLocaleDateString()} <ArrowRight size={10}/> {new Date(req.endDate).toLocaleDateString()} ({req.totalDays} Days)
                           </p>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-[11px] text-gray-600 line-clamp-1 max-w-[200px]">{req.reason}</p>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              req.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                              req.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                              req.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-gray-100 text-gray-500'
                           }`}>
                              {req.status.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {req.status === 'PENDING_APPROVAL' && (
                              <div className="flex justify-end gap-2">
                                 <button
                                    onClick={() => handleAction(req.id, 'reject')}
                                    disabled={!!processing}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                                 >
                                    <XCircle size={18}/>
                                 </button>
                                 <button
                                    onClick={() => handleAction(req.id, 'approve')}
                                    disabled={!!processing}
                                    className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-100 disabled:opacity-50"
                                 >
                                    <CheckCircle size={18}/>
                                 </button>
                              </div>
                           )}
                        </td>
                     </tr>
                   ))}
                   {requests.length === 0 && !loading && (
                     <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                           <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                           <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No leave requests found</p>
                        </td>
                     </tr>
                   )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
    </div>
  );
}
