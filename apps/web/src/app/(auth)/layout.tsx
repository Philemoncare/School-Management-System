'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px] space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="group transition-transform hover:scale-105 active:scale-95">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">EduFlow ERP</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Enterprise OS for Education</p>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-gray-200/50">
          {children}
        </div>

        {/* Footer info */}
        <div className="text-center space-y-4">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
             By continuing, you agree to EduFlow's <br />
             <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
           </p>
           <div className="pt-4 border-t border-gray-100">
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">© 2024 EduFlow Systems Inc. All rights reserved.</p>
           </div>
        </div>
      </div>

      {/* Decorative blobs for premium feel */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
         <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
         <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      </div>
    </div>
  );
}
