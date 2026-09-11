'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  BookMarked,
  BadgeCheck,
  Calendar,
  Settings,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-8">
        <div className="w-32 h-32 rounded-[2.5rem] bg-blue-600 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-blue-100">
           {user?.firstName[0]}{user?.lastName[0]}
        </div>
        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user?.firstName} {user?.lastName}</h1>
           <div className="flex items-center gap-3 mt-2">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Faculty Member</span>
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">ID: {user?.id.split('-')[0].toUpperCase()}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Account Overview */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <ShieldCheck className="text-blue-600" /> Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <ProfileItem label="Official Email" value={user?.email} icon={<Mail size={16}/>} />
                 <ProfileItem label="Phone Number" value="+233 54 000 0000" icon={<Phone size={16}/>} />
                 <ProfileItem label="Department" value="Senior High School" icon={<BookMarked size={16}/>} />
                 <ProfileItem label="Joined Date" value="Sep 2024" icon={<Calendar size={16}/>} />
              </div>
           </section>

           {/* Expertise */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <BadgeCheck className="text-blue-600" /> Core Specializations
              </h3>
              <div className="flex flex-wrap gap-3">
                 {['Mathematics', 'Physics', 'Information Technology', 'Applied Statistics'].map(skill => (
                   <span key={skill} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">{skill}</span>
                 ))}
              </div>
           </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="font-bold text-lg mb-6">Profile Controls</h3>
              <div className="space-y-4">
                 <ActionLink label="Edit Personal Info" href="/teacher/settings" />
                 <ActionLink label="Security & Password" href="/teacher/settings" />
                 <ActionLink label="Public Page" href="#" />
              </div>
           </div>

           <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8">
              <h4 className="text-blue-900 font-black text-sm uppercase tracking-widest mb-4">Teaching Load</h4>
              <p className="text-blue-700 text-sm font-medium leading-relaxed">
                 You are currently assigned to 4 class sections across 2 subjects.
              </p>
              <Link href="/teacher/classes" className="mt-6 inline-flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">
                 View Load Details <ChevronRight size={14}/>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value, icon }: any) {
  return (
    <div className="flex items-start gap-4">
       <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">{icon}</div>
       <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="text-sm font-black text-gray-900 mt-0.5">{value || 'N/A'}</p>
       </div>
    </div>
  );
}

function ActionLink({ label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
       <span className="text-xs font-black uppercase tracking-widest">{label}</span>
       <ChevronRight size={14} className="text-blue-500" />
    </Link>
  );
}
