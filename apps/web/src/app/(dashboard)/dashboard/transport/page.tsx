'use client';

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
    <div className="p-4 lg:p-8 space-y-8 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Navigation size={36} className="text-blue-600" />
            Transport Command
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">
            Fleet Management, Route Logistics, and Student Transit Authority.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['overview', 'vehicles', 'drivers', 'routes', 'assignments', 'trips', 'maintenance', 'fuel'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-fadeIn">
          <AlertCircle size={18} className="shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-xs font-bold animate-fadeIn">
          <CheckCircle size={18} className="shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600" size={48} />
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-4">Synchronizing Global Logistics...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewKpiCard title="Active Fleet" value={metrics?.activeVehicles} sub="Operational Vehicles" icon={<Bus className="text-blue-600"/>} color="bg-blue-50" />
                <OverviewKpiCard title="Active Routes" value={metrics?.activeRoutes} sub="Established Lines" icon={<MapPin className="text-emerald-600"/>} color="bg-emerald-50" />
                <OverviewKpiCard title="Total Transit" value={metrics?.studentsAssigned} sub="Assigned Students" icon={<Users className="text-purple-600"/>} color="bg-purple-50" />
                <OverviewKpiCard title="Trips Today" value={metrics?.totalTripsToday} sub="Scheduled Operations" icon={<Clock className="text-amber-600"/>} color="bg-amber-50" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 flex items-center gap-2">
                    <History size={18} className="text-gray-400" /> Recent Logistics History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                          <th className="pb-4">Route / Trip</th>
                          <th className="pb-4">Vehicle</th>
                          <th className="pb-4">Driver</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {trips.map((trip) => (
                          <tr key={trip.id} className="hover:bg-gray-50/50 group">
                            <td className="py-5">
                              <p className="font-bold text-gray-900">{trip.route.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-tight">{new Date(trip.date).toLocaleDateString()}</p>
                            </td>
                            <td className="py-5 font-mono font-bold text-blue-600">{trip.vehicle.registrationNumber}</td>
                            <td className="py-5">{trip.driver.staff.firstName} {trip.driver.staff.lastName}</td>
                            <td className="py-5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                trip.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                                trip.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 animate-pulse' :
                                trip.status === 'DELAYED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'
                              }`}>
                                {trip.status}
                              </span>
                            </td>
                            <td className="py-5 text-right">
                              <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600">
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
                  <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                      <Activity size={20} className="text-blue-400" /> Live Feed
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
              <div className="xl:col-span-2 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Institutional Fleet Registry</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search vehicle ID..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold w-64 focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className="p-6 border border-gray-100 rounded-[2rem] bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"><Bus className="text-blue-600" size={24} /></div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{v.status}</span>
                      </div>
                      <h4 className="text-lg font-black text-gray-900">{v.registrationNumber}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{v.make} {v.model} ({v.type})</p>
                      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5">
                          <Users size={12} /> {v.seatingCapacity} Seats
                        </div>
                        <button className="text-gray-400 hover:text-blue-600"><MoreVertical size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm h-fit">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                  <Plus size={18} className="text-blue-600" /> Provision Vehicle
                </h3>
                <form onSubmit={handleCreateVehicle} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Plate / Registration *</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-600/20 transition-all" value={vehicleForm.registrationNumber} onChange={e => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Make</label>
                      <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Type</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})}>
                        <option value="BUS">Bus</option>
                        <option value="VAN">Van</option>
                        <option value="SUV">SUV</option>
                        <option value="MINIBUS">Minibus</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Capacity (Seating) *</label>
                    <input required type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={vehicleForm.seatingCapacity} onChange={e => setVehicleForm({...vehicleForm, seatingCapacity: parseInt(e.target.value)})} />
                  </div>
                  <button disabled={submitting} type="submit" className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50">
                    {submitting ? 'Authenticating...' : 'Register Vehicle'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">Authorized Driver Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drivers.map(d => (
                    <div key={d.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {d.staff.firstName[0]}{d.staff.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-900">{d.staff.firstName} {d.staff.lastName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tight">License: {d.licenseNumber} ({d.licenseClass})</p>
                        <div className="flex items-center gap-2 mt-3">
                           <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-black text-gray-500 uppercase">{d.status}</span>
                           <span className="text-[9px] font-bold text-red-500 flex items-center gap-1"><Clock size={10}/> Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm h-fit">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" /> Driver Credentials
                </h3>
                <form onSubmit={handleCreateDriver} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Select Staff Member *</label>
                    <select required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={driverForm.staffId} onChange={e => setDriverForm({...driverForm, staffId: e.target.value})}>
                      <option value="">Choose Staff...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">License Number *</label>
                    <input required type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Class</label>
                      <input type="text" placeholder="e.g. Class D" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={driverForm.licenseClass} onChange={e => setDriverForm({...driverForm, licenseClass: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Expiry Date *</label>
                      <input required type="date" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" value={driverForm.licenseExpiry} onChange={e => setDriverForm({...driverForm, licenseExpiry: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gray-900 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">
                    Authorize Driver
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">Established Transit Routes</h3>
                 <div className="space-y-6">
                    {routes.map(r => (
                      <div key={r.id} className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50/50 hover:bg-white transition-all flex flex-col md:flex-row justify-between gap-6">
                         <div className="flex gap-6">
                            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><MapPin size={28} /></div>
                            <div>
                               <h4 className="text-xl font-black text-gray-900">{r.name}</h4>
                               <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">{r.direction} — {r.stops.length} Managed Stops</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[9px] font-black text-gray-400 uppercase">Load Balance</p>
                               <p className="text-lg font-black text-gray-900">{r._count?.assignments || 0} Students</p>
                            </div>
                            <button className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 shadow-sm"><ChevronRight size={20}/></button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm h-fit">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                   <Navigation size={18} className="text-blue-600" /> New Logistics Route
                 </h3>
                 <form className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Route Name *</label>
                      <input required type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold" placeholder="e.g. North Ridge Express" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Direction Policy</label>
                      <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold">
                        <option>Round Trip</option>
                        <option>Morning Pickup Only</option>
                        <option>Afternoon Drop-off Only</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
                      Deploy Route
                    </button>
                 </form>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8">Student Transport Allocations</h3>
               <div className="overflow-x-auto">
                 <table className="min-w-full text-xs text-left">
                    <thead>
                       <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                          <th className="pb-4">Student</th>
                          <th className="pb-4">Assigned Route</th>
                          <th className="pb-4">Pickup Point</th>
                          <th className="pb-4">Drop-off Point</th>
                          <th className="pb-4">Effective Date</th>
                          <th className="pb-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                       {assignments.map(a => (
                         <tr key={a.id} className="hover:bg-gray-50/50">
                            <td className="py-5 font-bold text-gray-900">{a.student.firstName} {a.student.lastName}</td>
                            <td className="py-5 text-blue-600 font-black">{a.route.name}</td>
                            <td className="py-5">{a.pickupStop?.name || 'School'}</td>
                            <td className="py-5">{a.dropoffStop?.name || 'School'}</td>
                            <td className="py-5 text-gray-500">{new Date(a.effectiveDate).toLocaleDateString()}</td>
                            <td className="py-5 text-right"><button className="text-gray-400 hover:text-blue-600"><MoreVertical size={16}/></button></td>
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
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value || 0}</p>
        <p className="text-[9px] font-bold text-gray-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function LiveUpdateItem({ label, time, status }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-400' : 'bg-blue-400'} shadow-[0_0_8px_rgba(96,165,250,0.5)]`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-200">{label}</span>
      </div>
      <span className="text-[9px] font-bold text-gray-500 uppercase">{time}</span>
    </div>
  );
}
