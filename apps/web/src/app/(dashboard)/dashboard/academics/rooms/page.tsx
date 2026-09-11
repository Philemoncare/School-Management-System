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
  CheckCircle2,
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Room Registry</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Manage physical classrooms, laboratories, and specialized facilities.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
          <Plus size={18} /> Add New Room
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
            <Search size={18} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by room name or code..."
              className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm hover:bg-gray-50 transition-all"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-8 gap-8">
            {filteredRooms.map((room) => (
              <div key={room.id} className="p-6 border border-gray-100 rounded-[2rem] bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-blue-500">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Layout size={24} />
                   </div>
                   <div className="flex items-center gap-1.5">
                      {room.status ? (
                         <span className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                         <span className="flex items-center gap-1 text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                   </div>
                </div>

                <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{room.name}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                   <Hash size={10}/> {room.code} • {room.type.replace('_', ' ')}
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Capacity</p>
                      <p className="text-sm font-black text-gray-900 flex items-center gap-2"><Users size={14} className="text-blue-500"/> {room.capacity}</p>
                   </div>
                   <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-1">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-black text-gray-900 flex items-center gap-2 truncate"><MapPin size={14} className="text-purple-500"/> {room.building || 'Main'}</p>
                   </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1">Edit Details <ChevronRight size={14}/></button>
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && !loading && (
               <div className="col-span-full py-20 text-center">
                  <MapPin className="mx-auto text-gray-200 mb-4" size={64} />
                  <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No rooms found in registry</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
