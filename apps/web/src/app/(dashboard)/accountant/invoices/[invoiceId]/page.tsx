'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Download,
  Printer,
  FileText,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
  User,
  Hash,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      const data = await apiFetch(`/finance/invoices/${invoiceId}`);
      setInvoice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;
  if (!invoice) return <div className="p-20 text-center text-gray-500">Invoice not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
             <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
             <Download size={16} /> Export PDF
           </button>
           <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
             <Printer size={16} /> Print Receipt
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Invoice Content */}
           <div className="bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-10 border-b border-gray-100 flex justify-between items-start">
                 <div className="space-y-4">
                    <StatusBadge status={invoice.status} />
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill To</p>
                       <h3 className="text-xl font-black text-gray-900">{invoice.student.firstName} {invoice.student.lastName}</h3>
                       <p className="text-sm font-bold text-gray-500">{invoice.student.studentNumber}</p>
                    </div>
                 </div>
                 <div className="text-right space-y-4">
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance Due</p>
                       <p className="text-2xl font-black text-blue-600">{invoice.currency} {parseFloat(invoice.balance).toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              <div className="p-10">
                 <table className="w-full">
                    <thead>
                       <tr className="text-left border-b border-gray-100">
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                          <th className="pb-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                          <th className="pb-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                          <th className="pb-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {invoice.items.map((item: any) => (
                         <tr key={item.id}>
                            <td className="py-6">
                               <p className="text-sm font-black text-gray-900">{item.description}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.feeCategory?.name}</p>
                            </td>
                            <td className="py-6 text-center text-sm font-bold text-gray-600">{item.quantity}</td>
                            <td className="py-6 text-right text-sm font-bold text-gray-600">{invoice.currency} {parseFloat(item.unitAmount).toLocaleString()}</td>
                            <td className="py-6 text-right text-sm font-black text-gray-900">{invoice.currency} {parseFloat(item.totalAmount).toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                    <tfoot>
                       <tr className="border-t border-gray-100">
                          <td colSpan={3} className="pt-8 pb-2 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</td>
                          <td className="pt-8 pb-2 text-right text-sm font-bold text-gray-900">{invoice.currency} {parseFloat(invoice.subtotal).toLocaleString()}</td>
                       </tr>
                       {parseFloat(invoice.discountTotal) > 0 && (
                         <tr>
                            <td colSpan={3} className="py-2 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Discounts</td>
                            <td className="py-2 text-right text-sm font-bold text-green-600">-{invoice.currency} {parseFloat(invoice.discountTotal).toLocaleString()}</td>
                         </tr>
                       )}
                       <tr>
                          <td colSpan={3} className="py-4 text-right text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Total Amount</td>
                          <td className="py-4 text-right text-xl font-black text-gray-900">{invoice.currency} {parseFloat(invoice.totalAmount).toLocaleString()}</td>
                       </tr>
                       <tr className="bg-blue-50/50">
                          <td colSpan={3} className="py-4 px-6 text-right text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Amount Paid</td>
                          <td className="py-4 px-6 text-right text-xl font-black text-blue-600">{invoice.currency} {parseFloat(invoice.amountPaid).toLocaleString()}</td>
                       </tr>
                    </tfoot>
                 </table>
              </div>
           </div>

           {/* Payment History */}
           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Payment Allocation History</h3>
              <div className="space-y-4">
                 {invoice.allocations?.map((alloc: any) => (
                   <div key={alloc.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-white rounded-2xl shadow-sm text-green-600"><CreditCard size={20}/></div>
                         <div>
                            <p className="text-sm font-black text-gray-900 leading-tight">Payment Reference: {alloc.payment?.paymentReference}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{new Date(alloc.createdAt).toLocaleDateString()} • {alloc.payment?.paymentMethod}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-gray-900">{invoice.currency} {parseFloat(alloc.amount).toLocaleString()}</p>
                         <Link href={`/accountant/payments/${alloc.paymentId}`} className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-all">
                            Details <ArrowUpRight size={10}/>
                         </Link>
                      </div>
                   </div>
                 ))}
                 {(!invoice.allocations || invoice.allocations.length === 0) && (
                   <p className="text-center py-10 text-gray-400 font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-[2rem]">No payments recorded yet</p>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white space-y-8">
              <h3 className="text-lg font-black tracking-tight">Financial Timeline</h3>
              <div className="space-y-6">
                 <TimelineItem date={invoice.issueDate} label="Invoice Issued" icon={<FileText size={14}/>} />
                 <TimelineItem date={invoice.dueDate} label="Payment Due" icon={<Calendar size={14}/>} isDue />
                 {invoice.amountPaid > 0 && <TimelineItem date={invoice.updatedAt} label="Last Payment Received" icon={<CheckCircle2 size={14}/>} color="text-green-500" />}
              </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Billing Info</h3>
              <div className="space-y-4">
                 <InfoRow label="Academic Year" value={invoice.academicYear?.name} />
                 <InfoRow label="Term" value={invoice.term?.name || 'N/A'} />
                 <InfoRow label="Class" value={invoice.class?.name || 'Unassigned'} />
                 <InfoRow label="Issue Date" value={new Date(invoice.issueDate).toLocaleDateString()} />
              </div>
           </div>

           {invoice.balance > 0 && (
             <Link
               href={`/accountant/payments/record?studentId=${invoice.studentId}&invoiceId=${invoice.id}`}
               className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
             >
                <CreditCard size={20}/> Record Payment
             </Link>
           )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    PAID: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    ISSUED: { color: 'bg-blue-100 text-blue-700', icon: FileText },
    OVERDUE: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
    PARTIALLY_PAID: { color: 'bg-orange-100 text-orange-700', icon: Clock },
    VOID: { color: 'bg-gray-100 text-gray-600', icon: XCircle },
  };
  const config = configs[status] || configs.ISSUED;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
       <Icon size={14} /> {status.replace('_', ' ')}
    </span>
  );
}

function TimelineItem({ date, label, icon, isDue, color = "text-blue-500" }: any) {
  return (
    <div className="flex gap-4">
       <div className={`mt-1.5 p-1.5 bg-white/10 rounded-lg ${color}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
          <p className={`text-xs font-medium mt-0.5 ${isDue ? 'text-red-400' : 'text-gray-400'}`}>{new Date(date).toLocaleDateString()}</p>
       </div>
    </div>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className="text-xs font-bold text-gray-900">{value}</span>
    </div>
  );
}
