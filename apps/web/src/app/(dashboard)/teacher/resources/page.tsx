'use client';

import React from 'react';
import {
  FolderOpen,
  FileText,
  Download,
  Search,
  Plus,
  MoreHorizontal,
  ChevronRight,
  BookMarked
} from 'lucide-react';

export default function TeacherResourcesPage() {
  const resources = [
    { name: 'Mathematics JHS 1 Curriculum', type: 'PDF', size: '2.4 MB', date: 'Oct 12, 2026' },
    { name: 'End of Term Assessment Template', type: 'DOCX', size: '1.1 MB', date: 'Sep 30, 2026' },
    { name: 'Parent-Teacher Meeting Agenda', type: 'PDF', size: '0.8 MB', date: 'Oct 05, 2026' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <FolderOpen className="text-blue-600" /> Academic Resources
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Teaching Materials • Guidelines • Institutional Documents</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2">
          <Plus size={18} /> Upload Resource
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <CategoryCard label="Curriculum" count={12} icon={<BookMarked className="text-blue-600"/>} />
         <CategoryCard label="Assessments" count={8} icon={<FileText className="text-orange-600"/>} />
         <CategoryCard label="Policy Docs" count={4} icon={<FolderOpen className="text-indigo-600"/>} />
         <CategoryCard label="Subject Tools" count={24} icon={<Plus className="text-green-600"/>} />
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search resources..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50/50">
              <tr>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Name</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Format</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Size</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Added</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 bg-white">
              {resources.map((res, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                   <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:text-blue-600 transition-all"><FileText size={18}/></div>
                         <p className="text-sm font-black text-gray-800">{res.name}</p>
                      </div>
                   </td>
                   <td className="px-8 py-5">
                      <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-tighter">{res.type}</span>
                   </td>
                   <td className="px-8 py-5 text-xs font-bold text-gray-400 uppercase">{res.size}</td>
                   <td className="px-8 py-5 text-xs font-bold text-gray-400 uppercase">{res.date}</td>
                   <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Download size={18}/></button>
                         <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryCard({ label, count, icon }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
       <div className="p-3 bg-gray-50 rounded-2xl w-fit group-hover:bg-white group-hover:shadow-sm transition-all mb-4">{icon}</div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
       <p className="text-2xl font-black text-gray-900 mt-1">{count} <span className="text-xs text-gray-300 font-bold uppercase tracking-tight">Files</span></p>
    </div>
  );
}
