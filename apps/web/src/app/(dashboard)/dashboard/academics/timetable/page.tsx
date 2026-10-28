'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar,
  Clock,
  LayoutGrid,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  MapPin,
  BookOpen,
  ArrowLeftRight
} from 'lucide-react';
import Link from 'next/link';

export default function TimetableDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'rooms' | 'substitutions'>('weekly');

  useEffect(() => {
    apiFetch('/timetable/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const { metrics } = data;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Academic Scheduling</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Design timetables, allocate rooms, and manage teacher substitutions.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/academics/timetable/new" className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
             <Plus size={18} /> Create Timetable
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <KpiCard title="Active Entries" value={metrics.totalEntries} sub="Published Lessons" icon={<LayoutGrid className="text-forest-700"/>} color="bg-sage-50" />
        <KpiCard title="Classrooms" value={metrics.totalRooms} sub="Managed Resources" icon={<MapPin className="text-forest-600"/>} color="bg-sage-50" />
        <KpiCard title="Substitutions" value={metrics.activeSubstitutions} sub="Pending Action" icon={<ArrowLeftRight className="text-warning-600"/>} color="bg-warning-50" />
        <KpiCard title="Calendar Events" value={metrics.currentCalendarEvents} sub="Happening Today" icon={<Calendar className="text-terracotta-600"/>} color="bg-terracotta-50" />
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center justify-between bg-ivory-50/50">
           <div className="flex gap-2">
              <TabButton active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} label="Weekly View" />
              <TabButton active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} label="Room Allocation" />
              <TabButton active={activeTab === 'substitutions'} onClick={() => setActiveTab('substitutions')} label="Substitutions" />
           </div>
           <div className="flex gap-3">
              <Link href="/dashboard/academics/calendar" className="px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-warm-500 hover:bg-ivory-50 transition-all flex items-center gap-2">
                 <Calendar size={14}/> Academic Calendar
              </Link>
              <Link href="/dashboard/academics/rooms" className="px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-warm-500 hover:bg-ivory-50 transition-all flex items-center gap-2">
                 <MapPin size={14}/> Room Registry
              </Link>
           </div>
        </div>

        <div className="p-8">
           {activeTab === 'weekly' && <WeeklyTimetablePlaceholder />}
           {activeTab === 'rooms' && <RoomAllocationPlaceholder />}
           {activeTab === 'substitutions' && <SubstitutionPlaceholder />}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-semibold text-charcoal-900">{value}</p>
        <p className="text-[11px] font-bold text-warm-400 mt-1 italic">{sub}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all ${
        active ? 'bg-charcoal-900 text-white shadow-lg' : 'text-warm-500 hover:bg-warm-100'
      }`}
    >
      {label}
    </button>
  );
}

function WeeklyTimetablePlaceholder() {
  return (
    <div className="py-20 text-center border-2 border-dashed border-warm-100 rounded-xl space-y-4">
       <LayoutGrid className="mx-auto text-warm-200" size={64} />
       <h3 className="text-xl font-semibold text-charcoal-900">Weekly Master Schedule</h3>
       <p className="text-warm-500 max-w-sm mx-auto font-medium">Configure academic years and bell schedules to begin drafting your master timetable.</p>
       <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide border border-sage-200 px-6 py-3 rounded-2xl hover:bg-sage-50 transition-all">Launch Timetable Builder</button>
    </div>
  );
}

function RoomAllocationPlaceholder() {
  return (
    <div className="py-20 text-center border-2 border-dashed border-warm-100 rounded-xl space-y-4">
       <MapPin className="mx-auto text-warm-200" size={64} />
       <h3 className="text-xl font-semibold text-charcoal-900">Room Resource Management</h3>
       <p className="text-warm-500 max-w-sm mx-auto font-medium">Track classroom occupancy and laboratory availability in real-time.</p>
       <Link href="/dashboard/academics/rooms" className="inline-block text-[11px] font-semibold text-forest-600 uppercase tracking-wide border border-sage-200 px-6 py-3 rounded-2xl hover:bg-sage-50 transition-all">Manage Room Registry</Link>
    </div>
  );
}

function SubstitutionPlaceholder() {
  return (
    <div className="py-20 text-center border-2 border-dashed border-warm-100 rounded-xl space-y-4">
       <ArrowLeftRight className="mx-auto text-warm-200" size={64} />
       <h3 className="text-xl font-semibold text-charcoal-900">Teacher Substitution Logs</h3>
       <p className="text-warm-500 max-w-sm mx-auto font-medium">Handle temporary teacher absences and assign qualified cover staff.</p>
       <button className="text-[11px] font-semibold text-warning-600 uppercase tracking-wide border border-warning-200 px-6 py-3 rounded-2xl hover:bg-warning-50 transition-all">Record Absence & Substitution</button>
    </div>
  );
}

