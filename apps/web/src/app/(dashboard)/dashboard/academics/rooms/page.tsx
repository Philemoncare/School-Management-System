'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  MapPin,
  Plus,
  Search,
  Loader2,
  Users,
  ChevronRight,
  Hash,
  Layout,
  PencilLine,
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  building?: string | null;
  floor?: string | null;
  location?: string | null;
  status: boolean;
}

const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'COMPUTER_LAB', label: 'Computer lab' },
  { value: 'LIBRARY', label: 'Library' },
  { value: 'HALL', label: 'Hall' },
  { value: 'AUDITORIUM', label: 'Auditorium' },
  { value: 'SPORTS_FACILITY', label: 'Sports facility' },
  { value: 'EXAMINATION_ROOM', label: 'Examination room' },
  { value: 'MEETING_ROOM', label: 'Meeting room' },
  { value: 'OTHER', label: 'Other' },
];

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [editing, setEditing] = useState<Room | 'new' | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/timetable/rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRooms([]);
      setError(err?.message || 'Could not load rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (typeFilter !== 'ALL' && room.type !== typeFilter) return false;
      if (!needle) return true;
      return (
        room.name.toLowerCase().includes(needle) ||
        room.code.toLowerCase().includes(needle) ||
        (room.building ?? '').toLowerCase().includes(needle)
      );
    });
  }, [rooms, search, typeFilter]);

  const filtersActive = Boolean(search) || typeFilter !== 'ALL';

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Room Registry
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Manage physical classrooms, laboratories and specialised facilities.
          </p>
        </div>
        <Button onClick={() => setEditing('new')} leftIcon={<Plus size={18} />}>
          Add New Room
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search rooms"
              placeholder="Search by room name, code or building…"
              className="w-full border-none bg-transparent text-sm font-bold focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter rooms by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-warm-200 bg-card p-3 text-[11px] font-semibold uppercase tracking-wide text-warm-600 shadow-sm focus:border-forest-600 focus:outline-none"
          >
            <option value="ALL">All room types</option>
            {ROOM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-200 bg-danger-50 px-6 py-3 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadRooms}>
              Try again
            </Button>
          </div>
        )}

        <div className="relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          {!loading && rooms.length === 0 && !error ? (
            <div className="p-8">
              <EmptyState
                icon={<MapPin className="h-8 w-8" />}
                title="No rooms in the registry"
                description="Add classrooms and facilities so timetables and examinations can be scheduled."
                actionButton={
                  <Button onClick={() => setEditing('new')} leftIcon={<Plus size={16} />}>
                    Add the first room
                  </Button>
                }
              />
            </div>
          ) : !loading && filteredRooms.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="No rooms match this view"
                description="Change the search text or room type filter."
                actionButton={
                  filtersActive ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        setTypeFilter('ALL');
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-3 lg:p-8">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="group rounded-xl border border-warm-100 border-b-4 border-b-transparent bg-ivory-50/50 p-5 transition-all hover:border-b-forest-500 hover:bg-card hover:shadow-xs sm:p-6"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <div className="rounded-2xl bg-card p-3 shadow-sm transition-all group-hover:bg-forest-700 group-hover:text-white">
                      <Layout size={24} />
                    </div>
                    {room.status ? (
                      <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success-600">
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-danger-600">
                        Inactive
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-charcoal-900 transition-colors group-hover:text-forest-700">
                    {room.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-warm-400">
                    <Hash size={10} /> {room.code} • {room.type.replace(/_/g, ' ')}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 rounded-xl border border-warm-100 bg-card p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">Capacity</p>
                      <p className="flex items-center gap-2 text-sm font-semibold text-charcoal-900">
                        <Users size={14} className="text-forest-500" /> {room.capacity}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border border-warm-100 bg-card p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">Location</p>
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-charcoal-900">
                        <MapPin size={14} className="text-terracotta-500" /> {room.building || 'Main'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setEditing(room)}
                      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400 hover:text-forest-700"
                    >
                      <PencilLine size={13} /> Edit Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <RoomModal
          room={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setEditing(null);
            showFeedback('SUCCESS', isNew ? 'Room added.' : 'Room updated.');
            loadRooms();
          }}
        />
      )}
    </div>
  );
}

function RoomModal({
  room,
  onClose,
  onSaved,
}: {
  room: Room | null;
  onClose: () => void;
  onSaved: (room: Room, isNew: boolean) => void;
}) {
  const isNew = !room;
  const [form, setForm] = useState({
    name: room?.name ?? '',
    code: room?.code ?? '',
    type: room?.type ?? 'CLASSROOM',
    capacity: room?.capacity ? String(room.capacity) : '30',
    building: room?.building ?? '',
    floor: room?.floor ?? '',
    location: room?.location ?? '',
    status: room?.status ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const capacity = Number(form.capacity);
    if (!form.name.trim() || !form.code.trim()) {
      setError('Room name and code are required.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Capacity must be a whole number of at least 1.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        type: form.type,
        capacity,
        building: form.building.trim(),
        floor: form.floor.trim(),
        location: form.location.trim(),
        status: form.status,
      };
      const saved = await apiFetch(
        isNew ? '/timetable/rooms' : `/timetable/rooms/${room!.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          body: JSON.stringify(payload),
        },
      );
      onSaved(saved, isNew);
    } catch (err: any) {
      setError(err?.message || 'Could not save the room.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'Add new room' : `Edit ${room!.name}`}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="room-form" isLoading={saving}>
            {isNew ? 'Add room' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Room name *"
            required
            placeholder="e.g. JHS 1A"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Room code *"
            required
            placeholder="e.g. JHS1A"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Select
            label="Room type"
            value={form.type}
            options={ROOM_TYPES}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="Capacity *"
            type="number"
            min={1}
            required
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
          <Input
            label="Building"
            value={form.building}
            onChange={(e) => setForm({ ...form, building: e.target.value })}
          />
          <Input
            label="Floor"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: e.target.value })}
          />
        </div>
        <Input
          label="Location notes"
          placeholder="e.g. West wing, next to the library"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        {!isNew && (
          <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.checked })}
              className="h-4 w-4 rounded border-warm-300 text-forest-700 focus:ring-forest-600"
            />
            Room is active and available for scheduling
          </label>
        )}
      </form>
    </Modal>
  );
}
