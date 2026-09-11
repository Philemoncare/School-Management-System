'use client';

import React from 'react';
import {
  PieChart,
  BarChart4,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Building2,
  ChevronRight,
  Printer
} from 'lucide-react';

export default function AccountantReportsPage() {
  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <BarChart4 className="text-blue-600" /> Financial Reports
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Deep-dive analysis of school revenue, collections and projections</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-blue-50 border border-blue-100 px-6 py-2.5 rounded-2xl">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Fiscal Year Progress</p>
              <div className="flex items-center gap-2">
                 <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-blue-600"></div>
                 </div>
                 <span className="text-xs font-black text-blue-600">67%</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue Distribution</h3>
                  <div className="flex items-center gap-2">
                     <button className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100">Weekly</button>
                     <button className="px-4 py-2 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">Monthly</button>
                  </div>
               </div>
               <div className="h-[350px] bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center relative overflow-hidden group">
                  <PieChart size={64} className="text-gray-200 group-hover:scale-110 transition-transform duration-700" />
                  <p className="absolute bottom-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Institutional Revenue Analytics</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <ReportCategoryCard
                 title="Collection Reports"
                 description="Daily, monthly and periodic collection summaries."
                 reports={['Daily Collection Log', 'Monthly Revenue Summary', 'Channel Distribution']}
                 icon={<DollarSign size={24}/>}
                 color="bg-green-50 text-green-600"
               />
               <ReportCategoryCard
                 title="Student Financials"
                 description="Outstanding balances and student account statements."
                 reports={['Ageing Report', 'Defaulters List', 'Statement of Accounts']}
                 icon={<Users size={24}/>}
                 color="bg-blue-50 text-blue-600"
               />
               <ReportCategoryCard
                 title="Institutional Billing"
                 description="Analysis of fee structures and invoice generation."
                 reports={['Fee Structure Analysis', 'Invoice Generation Log', 'Discount & Waiver Report']}
                 icon={<FileText size={24}/>}
                 color="bg-purple-50 text-purple-600"
               />
               <ReportCategoryCard
                 title="Audit & Compliance"
                 description="Ledger analysis and financial adjustment logs."
                 reports={['General Ledger Export', 'Audit Log (Finance)', 'Adjustment Summary']}
                 icon={<TrendingUp size={24}/>}
                 color="bg-orange-50 text-orange-600"
               />
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
               <h3 className="text-lg font-black mb-8 tracking-tight">Standard Reports</h3>
               <div className="space-y-4">
                  <ExportAction label="Master Collection PDF" />
                  <ExportAction label="Income Statement" />
                  <ExportAction label="Cash Flow Summary" />
                  <ExportAction label="Tax Summary (VAT/Sales)" />
               </div>
            </div>

            <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-xl font-black mb-2 tracking-tight">Custom Data Export</h3>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest opacity-80 leading-relaxed">
                     Configure custom fields and date ranges for advanced financial reporting and external auditing.
                  </p>
                  <button className="mt-8 w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                     <Download size={16}/> Start Export
                  </button>
               </div>
               <Building2 size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>
         </div>
      </div>
    </div>
  );
}

function ReportCategoryCard({ title, description, reports, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm hover:border-blue-100 transition-all group">
       <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{icon}</div>
       <h4 className="text-lg font-black text-gray-900 mb-2">{title}</h4>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">{description}</p>
       <div className="space-y-3">
          {reports.map((report: string) => (
            <button key={report} className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors py-2 border-b border-gray-50 last:border-0 group/item">
               {report} <ArrowUpRight size={12} className="group-hover/item:translate-x-0.5 transition-transform" />
            </button>
          ))}
       </div>
    </div>
  );
}

function ExportAction({ label }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group text-left">
       <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">{label}</span>
       <div className="flex gap-2">
          <Download size={14} className="text-gray-500 hover:text-blue-400 transition-colors" />
          <Printer size={14} className="text-gray-500 hover:text-blue-400 transition-colors" />
       </div>
    </button>
  );
}
