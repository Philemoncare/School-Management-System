'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Bus,
  MapPin,
  Users,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Navigation,
  Fuel,
  Wrench,
  FileText,
  ShieldCheck,
  Calendar,
  History,
  MoreVertical,
  Activity
} from 'lucide-react';

type TabType = 'overview' | 'vehicles' | 'drivers' | 'routes' | 'assignments' | 'trips' | 'maintenance' | 'fuel';

export default function TransportManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '', make: '', model: '', year: new Date().getFullYear(),
    type: 'BUS', seatingCapacity: 30, status: 'AVAILABLE'
  });
  const [driverForm, setDriverForm] = useState({
    staffId: '', licenseNumber: '', licenseClass: '', licenseExpiry: ''
  });
  const [routeForm, setRouteForm] = useState({
    name: '', code: '', description: '', direction: 'ROUND_TRIP'
  });
  const [assignmentForm, setAssignmentForm] = useState({
    studentId: '', routeId: '', pickupStopId: '', dropoffStopId: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'overview') {
        const res = await apiFetch('/transport/dashboard');
        setMetrics(res.metrics);
        setTrips(res.recentTrips);
      } else if (activeTab === 'vehicles') {
        const res = await apiFetch('/transport/vehicles');
        setVehicles(res);
      } else if (activeTab === 'drivers') {
        const [driversRes, staffRes] = await Promise.all([
          apiFetch('/transport/drivers'),
          apiFetch('/staff')
        ]);
        setDrivers(driversRes);
        setStaff(staffRes);
      } else if (activeTab === 'routes') {
        const res = await apiFetch('/transport/routes');
        setRoutes(res);
      } else if (activeTab === 'assignments') {
        const [assignmentsRes, routesRes, studentsRes] = await Promise.all([
          apiFetch('/transport/assignments'),
          apiFetch('/transport/routes'),
          apiFetch('/students')
        ]);
        setAssignments(assignmentsRes);
        setRoutes(routesRes);
        setStudents(studentsRes);
      } else if (activeTab === 'trips') {
        // Load trips logic...
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Logistics synchronization failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  }

  // Handlers
  async function handleCreateVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/transport/vehicles', { method: 'POST', body: JSON.stringify(vehicleForm) });
      setSuccessMsg('Vehicle provisioned successfully.');
      setVehicleForm({ registrationNumber: '', make: '', model: '', year: 2024, type: 'BUS', seatingCapacity: 30, status: 'AVAILABLE' });
      loadData();
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleCreateDriver(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/transport/drivers', { method: 'POST', body: JSON.stringify(driverForm) });
      setSuccessMsg('Driver credentials registered.');
      loadData();
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-ivory-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-warm-200 pb-8">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <Navigation size={36} className="text-forest-700" />
            Transport Command
          </h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">
            Fleet Management, Route Logistics, and Student Transit Authority.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['overview', 'vehicles', 'drivers', 'routes', 'assignments', 'trips', 'maintenance', 'fuel'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-charcoal-900 text-white shadow-lg shadow-warm-200'
                  : 'bg-card border border-warm-200 text-warm-600 hover:bg-ivory-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl flex items-center gap-3 text-danger-700 text-xs font-bold animate-fadeIn">
          <AlertCircle size={18} className="shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-success-50 border border-success-200 rounded-2xl flex items-center gap-3 text-success-700 text-xs font-bold animate-fadeIn">
          <CheckCircle size={18} className="shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-forest-700" size={48} />
          <p className="text-warm-400 text-xs font-semibold uppercase tracking-wide mt-4">Synchronizing Global Logistics...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewKpiCard title="Active Fleet" value={metrics?.activeVehicles} sub="Operational Vehicles" icon={<Bus className="text-forest-700"/>} color="bg-sage-50" />
                <OverviewKpiCard title="Active Routes" value={metrics?.activeRoutes} sub="Established Lines" icon={<MapPin className="text-forest-600"/>} color="bg-sage-50" />
                <OverviewKpiCard title="Total Transit" value={metrics?.studentsAssigned} sub="Assigned Students" icon={<Users className="text-terracotta-600"/>} color="bg-terracotta-50" />
                <OverviewKpiCard title="Trips Today" value={metrics?.totalTripsToday} sub="Scheduled Operations" icon={<Clock className="text-warning-600"/>} color="bg-warning-50" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8 flex items-center gap-2">
                    <History size={18} className="text-warm-400" /> Recent Logistics History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                          <th className="pb-4">Route / Trip</th>
                          <th className="pb-4">Vehicle</th>
                          <th className="pb-4">Driver</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                        {trips.map((trip) => (
                          <tr key={trip.id} className="hover:bg-ivory-50/50 group">
                            <td className="py-5">
                              <p className="font-bold text-charcoal-900">{trip.route.name}</p>
                              <p className="text-[11px] text-warm-400 uppercase tracking-tight">{new Date(trip.date).toLocaleDateString()}</p>
                            </td>
                            <td className="py-5 font-mono font-bold text-forest-700">{trip.vehicle.registrationNumber}</td>
                            <td className="py-5">{trip.driver.staff.firstName} {trip.driver.staff.lastName}</td>
                            <td className="py-5">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                trip.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                                trip.status === 'IN_PROGRESS' ? 'bg-sage-50 text-forest-800 animate-pulse' :
                                trip.status === 'DELAYED' ? 'bg-danger-50 text-danger-700' : 'bg-ivory-50 text-warm-500'
                              }`}>
                                {trip.status}
                              </span>
                            </td>
                            <td className="py-5 text-right">
                              <button className="p-2 hover:bg-card hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100 text-warm-400 hover:text-forest-700">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Activity size={20} className="text-sage-400" /> Live Feed
                    </h3>
                    <div className="space-y-6">
                      <LiveUpdateItem label="Route A Start" time="2m ago" />
                      <LiveUpdateItem label="Bus #102 Arrived" time="15m ago" />
                      <LiveUpdateItem label="Emergency Resolved" time="1h ago" status="success" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900">Institutional Fleet Registry</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" size={14} />
                    <input type="text" placeholder="Search vehicle ID..." className="pl-9 pr-4 py-2 bg-ivory-50 border border-warm-200 rounded-xl text-xs font-bold w-64 focus:outline-none focus:ring-2 focus:ring-forest-700/20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className="p-6 border border-warm-100 rounded-xl bg-ivory-50/50 hover:bg-card hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-card rounded-2xl border border-warm-100 shadow-sm"><Bus className="text-forest-700" size={24} /></div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${v.status === 'AVAILABLE' ? 'bg-success-100 text-success-700' : 'bg-sage-100 text-forest-800'}`}>{v.status}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-charcoal-900">{v.registrationNumber}</h4>
                      <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider mt-1">{v.make} {v.model} ({v.type})</p>
                      <div className="mt-6 flex items-center justify-between border-t border-warm-100 pt-4">
                        <div className="text-[11px] font-semibold text-warm-500 uppercase flex items-center gap-1.5">
                          <Users size={12} /> {v.seatingCapacity} Seats
                        </div>
                        <button className="text-warm-400 hover:text-forest-700"><MoreVertical size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm h-fit">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <Plus size={18} className="text-forest-700" /> Provision Vehicle
                </h3>
                <form onSubmit={handleCreateVehicle} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 ml-1 tracking-wide">Plate / Registration *</label>
                    <input required type="text" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-forest-700/20 transition-all" value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 ml-1 tracking-wide">Make</label>
                      <input type="text" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 ml-1 tracking-wide">Type</label>
                      <Select className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})}>
                        <option value="BUS">Bus</option>
                        <option value="VAN">Van</option>
                        <option value="SUV">SUV</option>
                        <option value="MINIBUS">Minibus</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 ml-1 tracking-wide">Capacity (Seating) *</label>
                    <input required type="number" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={vehicleForm.seatingCapacity} onChange={e => setVehicleForm({...vehicleForm, seatingCapacity: parseInt(e.target.value)})} />
                  </div>
                  <button disabled={submitting} type="submit" className="w-full bg-forest-700 text-white p-5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-100 disabled:opacity-50">
                    {submitting ? 'Authenticating...' : 'Register Vehicle'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8">Authorized Driver Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drivers.map(d => (
                    <div key={d.id} className="flex items-center gap-6 p-6 bg-ivory-50 rounded-xl border border-warm-100">
                      <div className="w-16 h-16 bg-forest-700 rounded-2xl flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                        {d.staff.firstName[0]}{d.staff.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-charcoal-900">{d.staff.firstName} {d.staff.lastName}</h4>
                        <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tight">License: {d.licenseNumber} ({d.licenseClass})</p>
                        <div className="flex items-center gap-2 mt-3">
                           <span className="px-2 py-0.5 bg-card border border-warm-200 rounded text-[11px] font-semibold text-warm-500 uppercase">{d.status}</span>
                           <span className="text-[11px] font-bold text-danger-500 flex items-center gap-1"><Clock size={10}/> Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm h-fit">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-forest-700" /> Driver Credentials
                </h3>
                <form onSubmit={handleCreateDriver} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">Select Staff Member *</label>
                    <Select required className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={driverForm.staffId} onChange={e => setDriverForm({...driverForm, staffId: e.target.value})}>
                      <option value="">Choose Staff...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">License Number *</label>
                    <input required type="text" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">Class</label>
                      <input type="text" placeholder="e.g. Class D" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={driverForm.licenseClass} onChange={e => setDriverForm({...driverForm, licenseClass: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">Expiry Date *</label>
                      <input required type="date" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" value={driverForm.licenseExpiry} onChange={e => setDriverForm({...driverForm, licenseExpiry: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-charcoal-900 text-white p-5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all shadow-xs shadow-warm-200">
                    Authorize Driver
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
                 <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8">Established Transit Routes</h3>
                 <div className="space-y-6">
                    {routes.map(r => (
                      <div key={r.id} className="p-8 border border-warm-100 rounded-xl bg-ivory-50/50 hover:bg-card transition-all flex flex-col md:flex-row justify-between gap-6">
                         <div className="flex gap-6">
                            <div className="w-14 h-14 bg-forest-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><MapPin size={28} /></div>
                            <div>
                               <h4 className="text-xl font-semibold text-charcoal-900">{r.name}</h4>
                               <p className="text-[11px] font-bold text-warm-400 uppercase mt-1 italic">{r.direction} — {r.stops.length} Managed Stops</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[11px] font-semibold text-warm-400 uppercase">Load Balance</p>
                               <p className="text-lg font-semibold text-charcoal-900">{r._count?.assignments || 0} Students</p>
                            </div>
                            <button className="p-4 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 shadow-sm"><ChevronRight size={20}/></button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm h-fit">
                 <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                   <Navigation size={18} className="text-forest-700" /> New Logistics Route
                 </h3>
                 <form className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">Route Name *</label>
                      <input required type="text" className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold" placeholder="e.g. North Ridge Express" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 mb-1.5 tracking-wide">Direction Policy</label>
                      <Select className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-xs font-bold">
                        <option>Round Trip</option>
                        <option>Morning Pickup Only</option>
                        <option>Afternoon Drop-off Only</option>
                      </Select>
                    </div>
                    <button type="submit" className="w-full bg-forest-600 text-white p-5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-700 transition-all shadow-xs shadow-sage-100">
                      Deploy Route
                    </button>
                 </form>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8">Student Transport Allocations</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full text-xs text-left">
                    <thead>
                       <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                          <th className="pb-4">Student</th>
                          <th className="pb-4">Assigned Route</th>
                          <th className="pb-4">Pickup Point</th>
                          <th className="pb-4">Drop-off Point</th>
                          <th className="pb-4">Effective Date</th>
                          <th className="pb-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                       {assignments.map(a => (
                         <tr key={a.id} className="hover:bg-ivory-50/50">
                            <td className="py-5 font-bold text-charcoal-900">{a.student.firstName} {a.student.lastName}</td>
                            <td className="py-5 text-forest-700 font-semibold">{a.route.name}</td>
                            <td className="py-5">{a.pickupStop?.name || 'School'}</td>
                            <td className="py-5">{a.dropoffStop?.name || 'School'}</td>
                            <td className="py-5 text-warm-500">{new Date(a.effectiveDate).toLocaleDateString()}</td>
                            <td className="py-5 text-right"><button className="text-warm-400 hover:text-forest-700"><MoreVertical size={16}/></button></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OverviewKpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-semibold text-charcoal-900">{value || 0}</p>
        <p className="text-[11px] font-bold text-warm-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function LiveUpdateItem({ label, time, status }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-success-400' : 'bg-sage-400'} shadow-[0_0_8px_rgba(96,165,250,0.5)]`} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-200">{label}</span>
      </div>
      <span className="text-[11px] font-bold text-warm-500 uppercase">{time}</span>
    </div>
  );
}
