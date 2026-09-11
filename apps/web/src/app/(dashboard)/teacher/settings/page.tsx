'use client';

import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Bell,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  ChevronRight,
  User,
  ShieldAlert
} from 'lucide-react';

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Workspace Settings</h1>
        <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Customize your teaching experience and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Nav */}
        <div className="space-y-2">
           <TabButton id="account" label="Personal Account" icon={<User size={18}/>} active={activeTab === 'account'} onClick={setActiveTab} />
           <TabButton id="security" label="Login & Security" icon={<Lock size={18}/>} active={activeTab === 'security'} onClick={setActiveTab} />
           <TabButton id="notifications" label="Alert Preferences" icon={<Bell size={18}/>} active={activeTab === 'notifications'} onClick={setActiveTab} />
           <TabButton id="display" label="Workspace Display" icon={<Eye size={18}/>} active={activeTab === 'display'} onClick={setActiveTab} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm min-h-[500px]">
              {activeTab === 'account' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <h3 className="text-xl font-black text-gray-900">Personal Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputGroup label="First Name" value="Teacher" />
                      <InputGroup label="Last Name" value="User" />
                      <InputGroup label="Display Email" value="teacher@school.com" />
                      <InputGroup label="Phone Number" value="+233 00 000 0000" />
                   </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <h3 className="text-xl font-black text-gray-900">Authentication Security</h3>
                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                      <ShieldAlert className="text-blue-600 mt-1" size={20} />
                      <div>
                         <p className="text-sm font-black text-blue-900">Two-Factor Authentication is recommended</p>
                         <p className="text-xs text-blue-700 font-medium mt-1 leading-relaxed">Protect your account and student data by adding an extra layer of security.</p>
                         <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Enable 2FA</button>
                      </div>
                   </div>
                   <div className="pt-6 border-t border-gray-100">
                      <button className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">
                         Change Account Password <ChevronRight size={14}/>
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <h3 className="text-xl font-black text-gray-900">Communication Channels</h3>
                   <div className="space-y-4">
                      <ToggleItem label="In-App Notifications" desc="Get alerts for messages and activity in the sidebar." active={true} />
                      <ToggleItem label="Email Summaries" desc="Weekly digest of pending tasks and performance." active={false} />
                      <ToggleItem label="Urgent SMS Alerts" desc="Immediate alerts for emergency maintenance." active={true} />
                   </div>
                </div>
              )}

              <div className="mt-12 pt-10 border-t border-gray-100 flex justify-end">
                 <button className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3">
                    <Save size={20} /> Save Configuration
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, icon, active, onClick, id }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
        active
          ? 'bg-blue-600 text-white font-black shadow-xl shadow-blue-100'
          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold'
      }`}
    >
       {icon}
       <span className="text-xs">{label}</span>
    </button>
  );
}

function InputGroup({ label, value }: any) {
  return (
    <div>
       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{label}</label>
       <input
         type="text"
         defaultValue={value}
         className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 transition-all"
       />
    </div>
  );
}

function ToggleItem({ label, desc, active }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl group hover:bg-gray-100/50 transition-colors">
       <div>
          <p className="text-sm font-black text-gray-900">{label}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{desc}</p>
       </div>
       <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`}></div>
       </div>
    </div>
  );
}
