'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Hash,
  Layout
} from 'lucide-react';

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    try {
      const data = await apiFetch('/timetable/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Room Registry</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Manage physical classrooms, laboratories, and specialized facilities.</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
          <Plus size={18} /> Add New Room
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
            <Search size={18} className="text-warm-400 mr-3" />
            <input
              type="text"
              placeholder="Search by room name or code..."
              className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-500 shadow-sm hover:bg-ivory-50 transition-all"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-8 gap-8">
            {filteredRooms.map((room) => (
              <div key={room.id} className="p-6 border border-warm-100 rounded-xl bg-ivory-50/50 hover:bg-card hover:shadow-xs transition-all group border-b-4 border-b-transparent hover:border-b-forest-500">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-card rounded-2xl shadow-sm group-hover:bg-forest-700 group-hover:text-white transition-all">
                      <Layout size={24} />
                   </div>
                   <div className="flex items-center gap-1.5">
                      {room.status ? (
                         <span className="flex items-center gap-1 text-[11px] font-semibold text-success-600 uppercase tracking-wide bg-success-50 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                         <span className="flex items-center gap-1 text-[11px] font-semibold text-danger-600 uppercase tracking-wide bg-danger-50 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                   </div>
                </div>

                <h4 className="text-lg font-semibold text-charcoal-900 group-hover:text-forest-700 transition-colors">{room.name}</h4>
                <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mt-1 flex items-center gap-1">
                   <Hash size={10}/> {room.code} • {room.type.replace('_', ' ')}
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="p-3 bg-card rounded-xl border border-warm-100 flex flex-col gap-1">
                      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Capacity</p>
                      <p className="text-sm font-semibold text-charcoal-900 flex items-center gap-2"><Users size={14} className="text-forest-500"/> {room.capacity}</p>
                   </div>
                   <div className="p-3 bg-card rounded-xl border border-warm-100 flex flex-col gap-1">
                      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-semibold text-charcoal-900 flex items-center gap-2 truncate"><MapPin size={14} className="text-terracotta-500"/> {room.building || 'Main'}</p>
                   </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide hover:text-forest-700 flex items-center gap-1">Edit Details <ChevronRight size={14}/></button>
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && !loading && (
               <div className="col-span-full py-20 text-center">
                  <MapPin className="mx-auto text-warm-200 mb-4" size={64} />
                  <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No rooms found in registry</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

