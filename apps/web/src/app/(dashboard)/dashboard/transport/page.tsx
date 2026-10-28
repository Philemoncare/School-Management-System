'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { StudentPicker } from '@/components/front-office/student-picker';
import {
  Bus,
  MapPin,
  Users,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Navigation,
  Fuel,
  Wrench,
  ShieldCheck,
  Activity,
  PencilLine,
  Play,
  CheckCheck,
  Map as RouteIcon,
  Gauge,} from 'lucide-react';

type TabType =
  | 'overview'
  | 'vehicles'
  | 'drivers'
  | 'routes'
  | 'assignments'
  | 'trips'
  | 'maintenance'
  | 'fuel';

const TABS: Array<{ id: TabType; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'routes', label: 'Routes' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'trips', label: 'Trips' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'fuel', label: 'Fuel' },
];

const VEHICLE_STATUSES = [
  'AVAILABLE',
  'ASSIGNED',
  'IN_SERVICE',
  'ON_TRIP',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'RETIRED',
];

const DRIVER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED'];

const DIRECTIONS = [
  { value: 'ROUND_TRIP', label: 'Round trip' },
  { value: 'PICKUP', label: 'Pickup only' },
  { value: 'DROP_OFF', label: 'Drop-off only' },
];

const MAINTENANCE_TYPES = [
  'Scheduled service',
  'Oil change',
  'Brake service',
  'Tyre replacement',
  'Engine repair',
  'Bodywork',
  'Inspection',
  'Other',
];

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return `GH₵ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function statusTone(status: string) {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'COMPLETED':
      return 'bg-success-50 text-success-700';
    case 'IN_SERVICE':
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'ON_TRIP':
      return 'bg-sage-100 text-forest-800';
    case 'MAINTENANCE':
    case 'SCHEDULED':
    case 'REPORTED':
    case 'ON_LEAVE':
      return 'bg-warning-50 text-warning-700';
    case 'OUT_OF_SERVICE':
    case 'DELAYED':
    case 'SUSPENDED':
    case 'TERMINATED':
    case 'CANCELLED':
      return 'bg-danger-50 text-danger-700';
    default:
      return 'bg-ivory-50 text-warm-500';
  }
}

export default function TransportManagementPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['TRANSPORT_OFFICER', 'SCHOOL_ADMIN'].includes(role));

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [metrics, setMetrics] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelRecords, setFuelRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [vehicleModal, setVehicleModal] = useState<any | 'new' | null>(null);
  const [driverModal, setDriverModal] = useState<any | 'new' | null>(null);
  const [routeModal, setRouteModal] = useState<any | 'new' | null>(null);
  const [stopsModal, setStopsModal] = useState<any | null>(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [tripModal, setTripModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [fuelModal, setFuelModal] = useState(false);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'overview') {
          const data = await apiFetch('/transport/dashboard');
          if (cancelled) return;
          setMetrics(data?.metrics ?? null);
          setRecentTrips(Array.isArray(data?.recentTrips) ? data.recentTrips : []);
        } else if (activeTab === 'vehicles') {
          const data = await apiFetch('/transport/vehicles');
          if (!cancelled) setVehicles(Array.isArray(data) ? data : []);
        } else if (activeTab === 'drivers') {
          const [driverData, staffData] = await Promise.all([
            apiFetch('/transport/drivers'),
            apiFetch('/staff'),
          ]);
          if (cancelled) return;
          setDrivers(Array.isArray(driverData) ? driverData : []);
          setStaff(Array.isArray(staffData) ? staffData : []);
        } else if (activeTab === 'routes') {
          const data = await apiFetch('/transport/routes');
          if (!cancelled) setRoutes(Array.isArray(data) ? data : []);
        } else if (activeTab === 'assignments') {
          const [assignmentData, routeData] = await Promise.all([
            apiFetch('/transport/assignments'),
            apiFetch('/transport/routes'),
          ]);
          if (cancelled) return;
          setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
          setRoutes(Array.isArray(routeData) ? routeData : []);
        } else if (activeTab === 'trips') {
          const [tripData, routeData, vehicleData, driverData] = await Promise.all([
            apiFetch('/transport/trips'),
            apiFetch('/transport/routes'),
            apiFetch('/transport/vehicles'),
            apiFetch('/transport/drivers'),
          ]);
          if (cancelled) return;
          setTrips(Array.isArray(tripData) ? tripData : []);
          setRoutes(Array.isArray(routeData) ? routeData : []);
          setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
          setDrivers(Array.isArray(driverData) ? driverData : []);
        } else if (activeTab === 'maintenance') {
          const [maintenanceData, vehicleData] = await Promise.all([
            apiFetch('/transport/maintenance'),
            apiFetch('/transport/vehicles'),
          ]);
          if (cancelled) return;
          setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
          setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
        } else if (activeTab === 'fuel') {
          const [fuelData, vehicleData] = await Promise.all([
            apiFetch('/transport/fuel'),
            apiFetch('/transport/vehicles'),
          ]);
          if (cancelled) return;
          setFuelRecords(Array.isArray(fuelData) ? fuelData : []);
          setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Could not load transport data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, reloadKey]);

  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  async function runAction(id: string, action: () => Promise<unknown>, successMessage: string) {
    if (!canManage) return;
    setBusyId(id);
    try {
      await action();
      showFeedback('SUCCESS', successMessage);
      reload();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'The action could not be completed.');
    } finally {
      setBusyId(null);
    }
  }

  const needle = search.trim().toLowerCase();

  const filteredVehicles = vehicles.filter((vehicle) =>
    !needle ||
    String(vehicle.registrationNumber ?? '').toLowerCase().includes(needle) ||
    `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.toLowerCase().includes(needle) ||
    String(vehicle.type ?? '').toLowerCase().includes(needle),
  );

  const filteredDrivers = drivers.filter((driver) =>
    !needle ||
    `${driver.staff?.firstName ?? ''} ${driver.staff?.lastName ?? ''}`.toLowerCase().includes(needle) ||
    String(driver.licenseNumber ?? '').toLowerCase().includes(needle),
  );

  const filteredRoutes = routes.filter((route) =>
    !needle ||
    String(route.name ?? '').toLowerCase().includes(needle) ||
    String(route.code ?? '').toLowerCase().includes(needle),
  );

  const filteredAssignments = assignments.filter((assignment) =>
    !needle ||
    `${assignment.student?.firstName ?? ''} ${assignment.student?.lastName ?? ''}`.toLowerCase().includes(needle) ||
    String(assignment.route?.name ?? '').toLowerCase().includes(needle) ||
    String(assignment.student?.studentNumber ?? '').toLowerCase().includes(needle),
  );

  const filteredTrips = trips.filter((trip) =>
    !needle ||
    String(trip.route?.name ?? '').toLowerCase().includes(needle) ||
    String(trip.vehicle?.registrationNumber ?? '').toLowerCase().includes(needle) ||
    `${trip.driver?.staff?.firstName ?? ''} ${trip.driver?.staff?.lastName ?? ''}`.toLowerCase().includes(needle),
  );

  const filteredMaintenance = maintenance.filter((record) =>
    !needle ||
    String(record.vehicle?.registrationNumber ?? '').toLowerCase().includes(needle) ||
    String(record.type ?? '').toLowerCase().includes(needle) ||
    String(record.provider ?? '').toLowerCase().includes(needle),
  );

  const filteredFuel = fuelRecords.filter((record) =>
    !needle ||
    String(record.vehicle?.registrationNumber ?? '').toLowerCase().includes(needle) ||
    String(record.fuelType ?? '').toLowerCase().includes(needle) ||
    String(record.supplier ?? '').toLowerCase().includes(needle),
  );

  const fuelTotal = filteredFuel.reduce((total, record) => total + Number(record.totalCost ?? 0), 0);

  const showSearch = activeTab !== 'overview';

  return (
    <div className="space-y-6 bg-ivory-50/30 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-warm-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <Navigation size={32} className="text-forest-700" />
            Transport
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Fleet, routes, student transit and vehicle upkeep.
          </p>
        </div>
        {canManage && activeTab === 'vehicles' && (
          <Button onClick={() => setVehicleModal('new')} leftIcon={<Plus size={18} />}>
            Register Vehicle
          </Button>
        )}
        {canManage && activeTab === 'drivers' && (
          <Button onClick={() => setDriverModal('new')} leftIcon={<Plus size={18} />}>
            Add Driver
          </Button>
        )}
        {canManage && activeTab === 'routes' && (
          <Button onClick={() => setRouteModal('new')} leftIcon={<Plus size={18} />}>
            New Route
          </Button>
        )}
        {canManage && activeTab === 'assignments' && (
          <Button onClick={() => setAssignmentModal(true)} leftIcon={<Plus size={18} />}>
            New Assignment
          </Button>
        )}
        {canManage && activeTab === 'trips' && (
          <Button onClick={() => setTripModal(true)} leftIcon={<Plus size={18} />}>
            Schedule Trip
          </Button>
        )}
        {canManage && activeTab === 'maintenance' && (
          <Button onClick={() => setMaintenanceModal(true)} leftIcon={<Wrench size={18} />}>
            Schedule Maintenance
          </Button>
        )}
        {canManage && activeTab === 'fuel' && (
          <Button onClick={() => setFuelModal(true)} leftIcon={<Fuel size={18} />}>
            Record Fuel
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Transport sections"
        className="flex flex-wrap gap-2 overflow-x-auto pb-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-charcoal-900 text-white shadow-md shadow-warm-200'
                : 'border border-warm-200 bg-card text-warm-600 hover:bg-ivory-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-bold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {showSearch && (
        <div className="flex items-center rounded-2xl border border-warm-200 bg-card px-4 py-2.5 shadow-sm sm:max-w-md">
          <Search size={18} className="mr-3 shrink-0 text-warm-400" />
          <input
            type="search"
            aria-label={`Search ${activeTab}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this section…"
            className="w-full border-none bg-transparent text-sm font-medium focus:outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
          <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading transport data…
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              trips={recentTrips}
              canManage={canManage}
              busyId={busyId}
              onStart={(trip) =>
                runAction(
                  trip.id,
                  () => apiFetch(`/transport/trips/${trip.id}/start`, { method: 'POST' }),
                  'Trip started.',
                )
              }
              onComplete={(trip) =>
                runAction(
                  trip.id,
                  () => apiFetch(`/transport/trips/${trip.id}/complete`, { method: 'POST' }),
                  'Trip completed.',
                )
              }
            />
          )}

          {activeTab === 'vehicles' && (
            <section className="space-y-6">
              {filteredVehicles.length === 0 ? (
                <EmptyState
                  icon={<Bus className="h-8 w-8" />}
                  title={vehicles.length === 0 ? 'No vehicles registered' : 'No vehicles match your search'}
                  description={
                    vehicles.length === 0
                      ? 'Register the school fleet so routes and trips can be scheduled.'
                      : 'Try a different registration number, make or vehicle type.'
                  }
                  actionButton={
                    vehicles.length === 0 && canManage ? (
                      <Button onClick={() => setVehicleModal('new')} leftIcon={<Plus size={16} />}>
                        Register the first vehicle
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="rounded-2xl border border-warm-100 bg-ivory-50 p-3">
                          <Bus className="text-forest-700" size={22} />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                            vehicle.status,
                          )}`}
                        >
                          {String(vehicle.status).replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-charcoal-900">{vehicle.registrationNumber}</h3>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-400">
                        {[vehicle.make, vehicle.model, vehicle.type].filter(Boolean).join(' • ') || 'Vehicle'}
                      </p>
                      <dl className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-warm-100 bg-ivory-50/60 p-3">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">Capacity</dt>
                          <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-charcoal-900">
                            <Users size={13} className="text-forest-500" /> {vehicle.seatingCapacity} seats
                          </dd>
                        </div>
                        <div className="rounded-xl border border-warm-100 bg-ivory-50/60 p-3">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">Mileage</dt>
                          <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-charcoal-900">
                            <Gauge size={13} className="text-terracotta-500" />{' '}
                            {vehicle.currentMileage == null ? '—' : `${Number(vehicle.currentMileage).toLocaleString()} km`}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex items-center justify-between border-t border-warm-100 pt-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                          {vehicle.driverAssignments?.length
                            ? `${vehicle.driverAssignments.length} driver${vehicle.driverAssignments.length === 1 ? '' : 's'}`
                            : 'No driver assigned'}
                        </span>
                        {canManage && (
                          <Button variant="ghost" size="sm" onClick={() => setVehicleModal(vehicle)} leftIcon={<PencilLine size={14} />}>
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'drivers' && (
            <section className="space-y-6">
              {filteredDrivers.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-8 w-8" />}
                  title={drivers.length === 0 ? 'No drivers registered' : 'No drivers match your search'}
                  description={
                    drivers.length === 0
                      ? 'Authorise a staff member as a driver to schedule trips.'
                      : 'Try a different name or licence number.'
                  }
                  actionButton={
                    drivers.length === 0 && canManage ? (
                      <Button onClick={() => setDriverModal('new')} leftIcon={<Plus size={16} />}>
                        Add the first driver
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDrivers.map((driver) => (
                    <div key={driver.id} className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-lg font-semibold text-white">
                          {(driver.staff?.firstName?.[0] ?? '') + (driver.staff?.lastName?.[0] ?? '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-charcoal-900">
                            {driver.staff?.firstName} {driver.staff?.lastName}
                          </h3>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">
                            {driver.staff?.employeeId || 'No employee ID'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                            driver.status,
                          )}`}
                        >
                          {String(driver.status).replace(/_/g, ' ')}
                        </span>
                      </div>
                      <dl className="mt-5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold uppercase tracking-wide text-warm-400">Licence</dt>
                          <dd className="font-semibold text-charcoal-900">
                            {driver.licenseNumber} ({driver.licenseClass})
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="font-semibold uppercase tracking-wide text-warm-400">Expires</dt>
                          <dd
                            className={`font-semibold ${
                              new Date(driver.licenseExpiry).getTime() < Date.now() ? 'text-danger-600' : 'text-charcoal-900'
                            }`}
                          >
                            {formatDate(driver.licenseExpiry)}
                          </dd>
                        </div>
                      </dl>
                      {canManage && (
                        <div className="mt-4 flex justify-end border-t border-warm-100 pt-4">
                          <Button variant="ghost" size="sm" onClick={() => setDriverModal(driver)} leftIcon={<PencilLine size={14} />}>
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'routes' && (
            <section className="space-y-4">
              {filteredRoutes.length === 0 ? (
                <EmptyState
                  icon={<RouteIcon className="h-8 w-8" />}
                  title={routes.length === 0 ? 'No routes yet' : 'No routes match your search'}
                  description={
                    routes.length === 0
                      ? 'Create a route, add its stops, then assign students to it.'
                      : 'Try a different route name or code.'
                  }
                  actionButton={
                    routes.length === 0 && canManage ? (
                      <Button onClick={() => setRouteModal('new')} leftIcon={<Plus size={16} />}>
                        Create the first route
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="flex flex-col gap-4 rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-forest-800">
                        <MapPin size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-charcoal-900">{route.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                              route.status,
                            )}`}
                          >
                            {String(route.status).replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-400">
                          {String(route.direction ?? 'ROUND_TRIP').replace(/_/g, ' ')} •{' '}
                          {route.stops?.length ?? 0} stop{route.stops?.length === 1 ? '' : 's'} •{' '}
                          {route._count?.assignments ?? 0} assigned
                        </p>
                        {route.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-warm-500">{route.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button variant="outline" size="sm" onClick={() => setStopsModal(route)} leftIcon={<MapPin size={14} />}>
                        Stops
                      </Button>
                      {canManage && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setRouteModal(route)} leftIcon={<PencilLine size={14} />}>
                            Edit
                          </Button>
                          <Button
                            variant={route.status === 'ACTIVE' ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={busyId === route.id}
                            onClick={() =>
                              runAction(
                                route.id,
                                () =>
                                  apiFetch(`/transport/routes/${route.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({
                                      status: route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                    }),
                                  }),
                                route.status === 'ACTIVE' ? 'Route deactivated.' : 'Route activated.',
                              )
                            }
                          >
                            {route.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {activeTab === 'assignments' && (
            <section className="rounded-xl border border-warm-200 bg-card shadow-sm">
              {filteredAssignments.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <EmptyState
                    icon={<Users className="h-8 w-8" />}
                    title={assignments.length === 0 ? 'No student assignments' : 'No assignments match your search'}
                    description={
                      assignments.length === 0
                        ? 'Assign a student to a route so their pickup and drop-off are tracked.'
                        : 'Try a different student, student number or route.'
                    }
                    actionButton={
                      assignments.length === 0 && canManage ? (
                        <Button onClick={() => setAssignmentModal(true)} leftIcon={<Plus size={16} />}>
                          Create the first assignment
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warm-100 bg-ivory-50/60 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                        <th className="px-5 py-4">Student</th>
                        <th className="px-5 py-4">Route</th>
                        <th className="px-5 py-4">Pickup</th>
                        <th className="px-5 py-4">Drop-off</th>
                        <th className="px-5 py-4">Effective</th>
                        <th className="px-5 py-4">Status</th>
                        {canManage && <th className="px-5 py-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-ivory-50/40">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-charcoal-900">
                              {assignment.student?.firstName} {assignment.student?.lastName}
                            </p>
                            <p className="text-[11px] font-bold uppercase text-warm-400">
                              {assignment.student?.studentNumber}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-forest-700">{assignment.route?.name}</td>
                          <td className="px-5 py-4">{assignment.pickupStop?.name || '—'}</td>
                          <td className="px-5 py-4">{assignment.dropoffStop?.name || '—'}</td>
                          <td className="px-5 py-4">{formatDate(assignment.effectiveDate)}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                                assignment.status,
                              )}`}
                            >
                              {assignment.status}
                            </span>
                          </td>
                          {canManage && (
                            <td className="px-5 py-4 text-right">
                              {assignment.status === 'ACTIVE' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  isLoading={busyId === assignment.id}
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        `End the transport assignment for ${assignment.student?.firstName ?? 'this student'}?`,
                                      )
                                    ) {
                                      return;
                                    }
                                    runAction(
                                      assignment.id,
                                      () =>
                                        apiFetch(`/transport/assignments/${assignment.id}`, {
                                          method: 'PATCH',
                                          body: JSON.stringify({ status: 'ENDED', endDate: new Date().toISOString() }),
                                        }),
                                      'Assignment ended.',
                                    );
                                  }}
                                >
                                  End
                                </Button>
                              ) : (
                                <span className="text-[11px] text-warm-400">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'trips' && (
            <section className="rounded-xl border border-warm-200 bg-card shadow-sm">
              {filteredTrips.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <EmptyState
                    icon={<Navigation className="h-8 w-8" />}
                    title={trips.length === 0 ? 'No trips scheduled' : 'No trips match your search'}
                    description={
                      trips.length === 0
                        ? 'Schedule a trip with a route, vehicle and driver.'
                        : 'Try a different route, vehicle or driver.'
                    }
                    actionButton={
                      trips.length === 0 && canManage ? (
                        <Button onClick={() => setTripModal(true)} leftIcon={<Plus size={16} />}>
                          Schedule the first trip
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warm-100 bg-ivory-50/60 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Route</th>
                        <th className="px-5 py-4">Vehicle</th>
                        <th className="px-5 py-4">Driver</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {filteredTrips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-ivory-50/40">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="font-semibold text-charcoal-900">{formatDate(trip.date)}</p>
                            <p className="text-[11px] font-bold uppercase text-warm-400">
                              {trip.actualStartTime
                                ? `Started ${new Date(trip.actualStartTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Not started'}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-charcoal-900">{trip.route?.name}</td>
                          <td className="px-5 py-4 font-mono text-forest-700">{trip.vehicle?.registrationNumber}</td>
                          <td className="px-5 py-4">
                            {trip.driver?.staff?.firstName} {trip.driver?.staff?.lastName}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                                trip.status,
                              )}`}
                            >
                              {String(trip.status).replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {canManage && ['SCHEDULED', 'DELAYED', 'BOARDING'].includes(trip.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  isLoading={busyId === trip.id}
                                  onClick={() =>
                                    runAction(
                                      trip.id,
                                      () => apiFetch(`/transport/trips/${trip.id}/start`, { method: 'POST' }),
                                      'Trip started.',
                                    )
                                  }
                                  leftIcon={<Play size={13} />}
                                >
                                  Start
                                </Button>
                              )}
                              {canManage && ['IN_PROGRESS', 'DELAYED', 'BOARDING'].includes(trip.status) && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  isLoading={busyId === trip.id}
                                  onClick={() =>
                                    runAction(
                                      trip.id,
                                      () => apiFetch(`/transport/trips/${trip.id}/complete`, { method: 'POST' }),
                                      'Trip completed.',
                                    )
                                  }
                                  leftIcon={<CheckCheck size={13} />}
                                >
                                  Complete
                                </Button>
                              )}
                              {!['SCHEDULED', 'DELAYED', 'BOARDING', 'IN_PROGRESS'].includes(trip.status) && (
                                <span className="text-[11px] text-warm-400">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'maintenance' && (
            <section className="rounded-xl border border-warm-200 bg-card shadow-sm">
              {filteredMaintenance.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <EmptyState
                    icon={<Wrench className="h-8 w-8" />}
                    title={maintenance.length === 0 ? 'No maintenance records' : 'No records match your search'}
                    description={
                      maintenance.length === 0
                        ? 'Schedule servicing to keep the fleet safe and roadworthy.'
                        : 'Try a different vehicle, type or provider.'
                    }
                    actionButton={
                      maintenance.length === 0 && canManage ? (
                        <Button onClick={() => setMaintenanceModal(true)} leftIcon={<Wrench size={16} />}>
                          Schedule the first service
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warm-100 bg-ivory-50/60 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                        <th className="px-5 py-4">Vehicle</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Scheduled</th>
                        <th className="px-5 py-4">Completed</th>
                        <th className="px-5 py-4">Cost</th>
                        <th className="px-5 py-4">Status</th>
                        {canManage && <th className="px-5 py-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {filteredMaintenance.map((record) => (
                        <tr key={record.id} className="hover:bg-ivory-50/40">
                          <td className="px-5 py-4 font-mono font-semibold text-forest-700">
                            {record.vehicle?.registrationNumber}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-charcoal-900">{record.type}</p>
                            {record.provider && <p className="text-[11px] text-warm-400">{record.provider}</p>}
                          </td>
                          <td className="px-5 py-4">{formatDate(record.scheduledDate)}</td>
                          <td className="px-5 py-4">{formatDate(record.completedDate)}</td>
                          <td className="px-5 py-4">{record.cost == null ? '—' : money(record.cost)}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                                record.status,
                              )}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          {canManage && (
                            <td className="px-5 py-4 text-right">
                              {['SCHEDULED', 'REPORTED', 'ACTIVE'].includes(record.status) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  isLoading={busyId === record.id}
                                  onClick={() => {
                                    if (!window.confirm(`Mark ${record.type} for ${record.vehicle?.registrationNumber} as completed?`)) {
                                      return;
                                    }
                                    runAction(
                                      record.id,
                                      () =>
                                        apiFetch(`/transport/maintenance/${record.id}`, {
                                          method: 'PATCH',
                                          body: JSON.stringify({
                                            status: 'COMPLETED',
                                            completedDate: new Date().toISOString(),
                                          }),
                                        }),
                                      'Maintenance completed.',
                                    );
                                  }}
                                  leftIcon={<CheckCircle size={13} />}
                                >
                                  Complete
                                </Button>
                              ) : (
                                <span className="text-[11px] text-warm-400">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'fuel' && (
            <section className="rounded-xl border border-warm-200 bg-card shadow-sm">
              {filteredFuel.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <EmptyState
                    icon={<Fuel className="h-8 w-8" />}
                    title={fuelRecords.length === 0 ? 'No fuel records' : 'No records match your search'}
                    description={
                      fuelRecords.length === 0
                        ? 'Record fuel purchases to track running costs per vehicle.'
                        : 'Try a different vehicle, fuel type or supplier.'
                    }
                    actionButton={
                      fuelRecords.length === 0 && canManage ? (
                        <Button onClick={() => setFuelModal(true)} leftIcon={<Fuel size={16} />}>
                          Record the first purchase
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-100 bg-ivory-50/60 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                      {filteredFuel.length} record{filteredFuel.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-sm font-semibold text-charcoal-900">Total: {money(fuelTotal)}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-warm-100 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                          <th className="px-5 py-4">Date</th>
                          <th className="px-5 py-4">Vehicle</th>
                          <th className="px-5 py-4">Fuel</th>
                          <th className="px-5 py-4">Quantity</th>
                          <th className="px-5 py-4">Unit price</th>
                          <th className="px-5 py-4">Total</th>
                          <th className="px-5 py-4">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                        {filteredFuel.map((record) => (
                          <tr key={record.id} className="hover:bg-ivory-50/40">
                            <td className="px-5 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                            <td className="px-5 py-4 font-mono font-semibold text-forest-700">
                              {record.vehicle?.registrationNumber}
                            </td>
                            <td className="px-5 py-4">{record.fuelType}</td>
                            <td className="px-5 py-4">{Number(record.quantity).toLocaleString()} L</td>
                            <td className="px-5 py-4">{money(record.unitPrice)}</td>
                            <td className="px-5 py-4 font-semibold text-charcoal-900">{money(record.totalCost)}</td>
                            <td className="px-5 py-4">{record.supplier || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      {vehicleModal && (
        <VehicleModal
          vehicle={vehicleModal === 'new' ? null : vehicleModal}
          onClose={() => setVehicleModal(null)}
          onSaved={() => {
            setVehicleModal(null);
            showFeedback('SUCCESS', vehicleModal === 'new' ? 'Vehicle registered.' : 'Vehicle updated.');
            reload();
          }}
        />
      )}

      {driverModal && (
        <DriverModal
          driver={driverModal === 'new' ? null : driverModal}
          staff={staff}
          onClose={() => setDriverModal(null)}
          onSaved={() => {
            setDriverModal(null);
            showFeedback('SUCCESS', driverModal === 'new' ? 'Driver authorised.' : 'Driver updated.');
            reload();
          }}
        />
      )}

      {routeModal && (
        <RouteModal
          route={routeModal === 'new' ? null : routeModal}
          onClose={() => setRouteModal(null)}
          onSaved={() => {
            setRouteModal(null);
            showFeedback('SUCCESS', routeModal === 'new' ? 'Route created.' : 'Route updated.');
            reload();
          }}
        />
      )}

      {stopsModal && (
        <StopsModal
          route={stopsModal}
          canManage={canManage}
          onClose={() => setStopsModal(null)}
          onChanged={reload}
        />
      )}

      {assignmentModal && (
        <AssignmentModal
          routes={routes}
          onClose={() => setAssignmentModal(false)}
          onSaved={() => {
            setAssignmentModal(false);
            showFeedback('SUCCESS', 'Transport assignment created.');
            reload();
          }}
        />
      )}

      {tripModal && (
        <TripModal
          routes={routes.filter((route) => route.status === 'ACTIVE')}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setTripModal(false)}
          onSaved={() => {
            setTripModal(false);
            showFeedback('SUCCESS', 'Trip scheduled.');
            reload();
          }}
        />
      )}

      {maintenanceModal && (
        <MaintenanceModal
          vehicles={vehicles}
          onClose={() => setMaintenanceModal(false)}
          onSaved={() => {
            setMaintenanceModal(false);
            showFeedback('SUCCESS', 'Maintenance scheduled.');
            reload();
          }}
        />
      )}

      {fuelModal && (
        <FuelModal
          vehicles={vehicles}
          onClose={() => setFuelModal(false)}
          onSaved={() => {
            setFuelModal(false);
            showFeedback('SUCCESS', 'Fuel purchase recorded.');
            reload();
          }}
        />
      )}
    </div>
  );
}

function OverviewTab({
  metrics,
  trips,
  canManage,
  busyId,
  onStart,
  onComplete,
}: {
  metrics: any;
  trips: any[];
  canManage: boolean;
  busyId: string | null;
  onStart: (trip: any) => void;
  onComplete: (trip: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Active fleet" value={metrics?.activeVehicles ?? 0} sub="In service" icon={<Bus size={20} />} tone="bg-sage-50 text-forest-700" />
        <KpiCard title="Available" value={metrics?.availableVehicles ?? 0} sub="Ready to deploy" icon={<CheckCircle size={20} />} tone="bg-success-50 text-success-700" />
        <KpiCard title="Active routes" value={metrics?.activeRoutes ?? 0} sub="Established lines" icon={<MapPin size={20} />} tone="bg-sage-50 text-forest-600" />
        <KpiCard title="Students" value={metrics?.studentsAssigned ?? 0} sub="Assigned to transport" icon={<Users size={20} />} tone="bg-terracotta-50 text-terracotta-600" />
        <KpiCard title="Trips today" value={metrics?.totalTripsToday ?? 0} sub={`${metrics?.tripsInProgress ?? 0} in progress`} icon={<Clock size={20} />} tone="bg-warning-50 text-warning-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6 xl:col-span-2">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            <Activity size={18} className="text-warm-400" /> Today &amp; upcoming trips
          </h2>
          {trips.length === 0 ? (
            <p className="rounded-xl border border-dashed border-warm-200 py-10 text-center text-xs font-semibold uppercase tracking-wide text-warm-400">
              No trips scheduled
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-warm-100 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-ivory-50/40">
                      <td className="py-4">
                        <p className="font-semibold text-charcoal-900">{trip.route?.name}</p>
                        <p className="text-[11px] font-bold uppercase text-warm-400">{formatDate(trip.date)}</p>
                      </td>
                      <td className="py-4 font-mono text-forest-700">{trip.vehicle?.registrationNumber}</td>
                      <td className="py-4">
                        {trip.driver?.staff?.firstName} {trip.driver?.staff?.lastName}
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(trip.status)}`}>
                          {String(trip.status).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && ['SCHEDULED', 'DELAYED', 'BOARDING'].includes(trip.status) && (
                            <Button variant="outline" size="sm" isLoading={busyId === trip.id} onClick={() => onStart(trip)}>
                              Start
                            </Button>
                          )}
                          {canManage && ['IN_PROGRESS', 'DELAYED', 'BOARDING'].includes(trip.status) && (
                            <Button variant="primary" size="sm" isLoading={busyId === trip.id} onClick={() => onComplete(trip)}>
                              Complete
                            </Button>
                          )}
                          {!canManage && <span className="text-[11px] text-warm-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl bg-charcoal-900 p-5 text-white sm:p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <ShieldCheck size={18} className="text-sage-400" /> Fleet readiness
          </h2>
          <ReadinessRow label="Available" value={metrics?.availableVehicles ?? 0} tone="bg-success-400" />
          <ReadinessRow label="In service" value={metrics?.activeVehicles ?? 0} tone="bg-sage-400" />
          <ReadinessRow label="In maintenance" value={metrics?.maintenanceVehicles ?? 0} tone="bg-terracotta-400" />
          <ReadinessRow label="Maintenance due" value={metrics?.maintenanceDue ?? 0} tone="bg-warning-400" />
          <ReadinessRow label="Delayed trips" value={metrics?.delayedTrips ?? 0} tone="bg-danger-400" />
          <p className="pt-2 text-[11px] leading-relaxed text-warm-400">
            {metrics?.activeDrivers ?? 0} active driver{(metrics?.activeDrivers ?? 0) === 1 ? '' : 's'} available for dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, tone }: any) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-charcoal-900">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-warm-400">{sub}</p>
    </div>
  );
}

function ReadinessRow({ label, value, tone }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-warm-200">
        <span className={`h-2 w-2 rounded-full ${tone}`} /> {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ModalError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
      {message}
    </p>
  );
}

function VehicleModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !vehicle;
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ? String(vehicle.year) : '',
    type: vehicle?.type ?? 'BUS',
    seatingCapacity: vehicle?.seatingCapacity ? String(vehicle.seatingCapacity) : '30',
    status: vehicle?.status ?? 'AVAILABLE',
    currentMileage: vehicle?.currentMileage != null ? String(vehicle.currentMileage) : '',
    insuranceNumber: vehicle?.insuranceNumber ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const capacity = Number(form.seatingCapacity);
    if (!form.registrationNumber.trim()) {
      setError('Enter the registration number.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Seating capacity must be a whole number of at least 1.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        registrationNumber: form.registrationNumber.trim(),
        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        type: form.type.trim() || undefined,
        seatingCapacity: capacity,
        status: form.status,
        insuranceNumber: form.insuranceNumber.trim() || undefined,
      };
      if (form.year.trim()) payload.year = Number(form.year);
      if (form.currentMileage.trim()) payload.currentMileage = Number(form.currentMileage);
      await apiFetch(isNew ? '/transport/vehicles' : `/transport/vehicles/${vehicle.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the vehicle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'Register vehicle' : `Edit ${vehicle.registrationNumber}`}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" isLoading={saving}>
            {isNew ? 'Register vehicle' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Registration number *"
            required
            placeholder="e.g. GT 1234-22"
            value={form.registrationNumber}
            onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={VEHICLE_STATUSES.map((status) => ({
              value: status,
              label: status.replace(/_/g, ' '),
            }))}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
          <Input label="Make" value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} />
          <Input label="Model" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
          <Input
            label="Year"
            type="number"
            min={1950}
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(event) => setForm({ ...form, year: event.target.value })}
          />
          <Input
            label="Vehicle type"
            placeholder="e.g. Bus, Van"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          />
          <Input
            label="Seating capacity *"
            type="number"
            min={1}
            required
            value={form.seatingCapacity}
            onChange={(event) => setForm({ ...form, seatingCapacity: event.target.value })}
          />
          <Input
            label="Current mileage (km)"
            type="number"
            min={0}
            value={form.currentMileage}
            onChange={(event) => setForm({ ...form, currentMileage: event.target.value })}
          />
          <Input
            label="Insurance number"
            value={form.insuranceNumber}
            onChange={(event) => setForm({ ...form, insuranceNumber: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}

function DriverModal({
  driver,
  staff,
  onClose,
  onSaved,
}: {
  driver: any | null;
  staff: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !driver;
  const [form, setForm] = useState({
    staffId: driver?.staffId ?? '',
    licenseNumber: driver?.licenseNumber ?? '',
    licenseClass: driver?.licenseClass ?? '',
    licenseExpiry: driver?.licenseExpiry
      ? new Date(driver.licenseExpiry).toISOString().slice(0, 10)
      : '',
    status: driver?.status ?? 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (isNew && !form.staffId) {
      setError('Select the staff member who will drive.');
      return;
    }
    if (!form.licenseNumber.trim() || !form.licenseClass.trim() || !form.licenseExpiry) {
      setError('Licence number, class and expiry date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        licenseNumber: form.licenseNumber.trim(),
        licenseClass: form.licenseClass.trim(),
        licenseExpiry: new Date(`${form.licenseExpiry}T00:00:00`).toISOString(),
        status: form.status,
      };
      if (isNew) payload.staffId = form.staffId;
      await apiFetch(isNew ? '/transport/drivers' : `/transport/drivers/${driver.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the driver.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'Authorise driver' : `Edit ${driver.staff?.firstName ?? ''} ${driver.staff?.lastName ?? ''}`.trim()}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="driver-form" isLoading={saving}>
            {isNew ? 'Authorise driver' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="driver-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {isNew ? (
          <Select
            label="Staff member *"
            value={form.staffId}
            options={[
              { value: '', label: staff.length ? 'Select staff member' : 'No staff records available' },
              ...staff.map((member) => ({
                value: member.id,
                label: `${member.firstName} ${member.lastName}${member.employeeId ? ` (${member.employeeId})` : ''}`,
              })),
            ]}
            onChange={(event) => setForm({ ...form, staffId: event.target.value })}
          />
        ) : (
          <p className="rounded-lg bg-ivory-50 p-3 text-xs font-semibold text-warm-600">
            Driver: {driver.staff?.firstName} {driver.staff?.lastName}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Licence number *"
            required
            value={form.licenseNumber}
            onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })}
          />
          <Input
            label="Licence class *"
            required
            placeholder="e.g. Class D"
            value={form.licenseClass}
            onChange={(event) => setForm({ ...form, licenseClass: event.target.value })}
          />
          <Input
            label="Licence expiry *"
            type="date"
            required
            value={form.licenseExpiry}
            onChange={(event) => setForm({ ...form, licenseExpiry: event.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={DRIVER_STATUSES.map((status) => ({
              value: status,
              label: status.replace(/_/g, ' '),
            }))}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}

function RouteModal({
  route,
  onClose,
  onSaved,
}: {
  route: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !route;
  const [form, setForm] = useState({
    name: route?.name ?? '',
    code: route?.code ?? '',
    direction: route?.direction ?? 'ROUND_TRIP',
    description: route?.description ?? '',
    estimatedDuration: route?.estimatedDuration != null ? String(route.estimatedDuration) : '',
    estimatedDistance: route?.estimatedDistance != null ? String(route.estimatedDistance) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setError('Enter a route name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        direction: form.direction,
        description: form.description.trim() || undefined,
      };
      if (form.estimatedDuration.trim()) payload.estimatedDuration = Number(form.estimatedDuration);
      if (form.estimatedDistance.trim()) payload.estimatedDistance = Number(form.estimatedDistance);
      await apiFetch(isNew ? '/transport/routes' : `/transport/routes/${route.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the route.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isNew ? 'New transport route' : `Edit ${route.name}`}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="route-form" isLoading={saving}>
            {isNew ? 'Create route' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="route-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Route name *"
            required
            placeholder="e.g. North Ridge Express"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Route code"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Select
            label="Direction"
            value={form.direction}
            options={DIRECTIONS}
            onChange={(event) => setForm({ ...form, direction: event.target.value })}
          />
          <Input
            label="Estimated duration (minutes)"
            type="number"
            min={1}
            value={form.estimatedDuration}
            onChange={(event) => setForm({ ...form, estimatedDuration: event.target.value })}
          />
          <Input
            label="Estimated distance (km)"
            type="number"
            min={0}
            step="0.1"
            value={form.estimatedDistance}
            onChange={(event) => setForm({ ...form, estimatedDistance: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="route-description" className="block text-xs font-semibold text-charcoal-800">
            Description
          </label>
          <textarea
            id="route-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}

function StopsModal({
  route,
  canManage,
  onClose,
  onChanged,
}: {
  route: any;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const nextSequence =
    (route.stops ?? []).reduce((max: number, stop: any) => Math.max(max, stop.sequence ?? 0), 0) + 1;
  const [form, setForm] = useState({
    name: '',
    address: '',
    sequence: String(nextSequence),
    estimatedArrivalTime: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setError('Enter a stop name.');
      return;
    }
    const sequence = Number(form.sequence);
    if (!Number.isInteger(sequence) || sequence < 1) {
      setError('Sequence must be a positive whole number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/transport/routes/${route.id}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          sequence,
          estimatedArrivalTime: form.estimatedArrivalTime.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Stop added to route.');
      onChanged();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not add the stop.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Stops on ${route.name}`} size="lg">
      <div className="space-y-5">
        {(route.stops ?? []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-warm-200 p-6 text-center text-xs font-semibold uppercase tracking-wide text-warm-400">
            No stops added yet
          </p>
        ) : (
          <ol className="space-y-2">
            {(route.stops ?? []).map((stop: any) => (
              <li
                key={stop.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-warm-100 bg-ivory-50/60 p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-[11px] font-semibold text-white">
                    {stop.sequence}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-charcoal-900">{stop.name}</p>
                    {(stop.address || stop.estimatedArrivalTime) && (
                      <p className="truncate text-[11px] text-warm-500">
                        {[stop.address, stop.estimatedArrivalTime].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {canManage && (
          <form onSubmit={submit} className="space-y-4 rounded-xl border border-warm-200 p-4">
            <ModalError message={error} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Add a stop</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Stop name *"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Input
                label="Sequence *"
                type="number"
                min={1}
                required
                value={form.sequence}
                onChange={(event) => setForm({ ...form, sequence: event.target.value })}
              />
              <Input
                label="Address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
              <Input
                label="Estimated arrival"
                placeholder="e.g. 07:15"
                value={form.estimatedArrivalTime}
                onChange={(event) => setForm({ ...form, estimatedArrivalTime: event.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={saving}>
                Add stop
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

function AssignmentModal({
  routes,
  onClose,
  onSaved,
}: {
  routes: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [student, setStudent] = useState<any | null>(null);
  const [form, setForm] = useState({
    routeId: '',
    pickupStopId: '',
    dropoffStopId: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedRoute = routes.find((route) => route.id === form.routeId);
  const stops = selectedRoute?.stops ?? [];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!student) {
      setError('Select a student.');
      return;
    }
    if (!form.routeId) {
      setError('Select a route.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/transport/assignments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          routeId: form.routeId,
          pickupStopId: form.pickupStopId || undefined,
          dropoffStopId: form.dropoffStopId || undefined,
          effectiveDate: new Date(`${form.effectiveDate}T00:00:00`).toISOString(),
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not create the assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New transport assignment"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" isLoading={saving}>
            Create assignment
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {routes.filter((route) => route.status === 'ACTIVE').length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            Create and activate a route before assigning students.
          </p>
        ) : (
          <>
            <StudentPicker selected={student} onSelect={setStudent} />
            <Select
              label="Route *"
              value={form.routeId}
              options={[
                { value: '', label: 'Select route' },
                ...routes
                  .filter((route) => route.status === 'ACTIVE')
                  .map((route) => ({ value: route.id, label: route.name })),
              ]}
              onChange={(event) =>
                setForm({ ...form, routeId: event.target.value, pickupStopId: '', dropoffStopId: '' })
              }
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Pickup stop"
                value={form.pickupStopId}
                options={[
                  { value: '', label: 'Not specified' },
                  ...stops.map((stop: any) => ({ value: stop.id, label: stop.name })),
                ]}
                onChange={(event) => setForm({ ...form, pickupStopId: event.target.value })}
              />
              <Select
                label="Drop-off stop"
                value={form.dropoffStopId}
                options={[
                  { value: '', label: 'Not specified' },
                  ...stops.map((stop: any) => ({ value: stop.id, label: stop.name })),
                ]}
                onChange={(event) => setForm({ ...form, dropoffStopId: event.target.value })}
              />
              <Input
                label="Effective date *"
                type="date"
                required
                value={form.effectiveDate}
                onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

function TripModal({
  routes,
  vehicles,
  drivers,
  onClose,
  onSaved,
}: {
  routes: any[];
  vehicles: any[];
  drivers: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    routeId: '',
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().slice(0, 10),
    time: '07:00',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableDrivers = drivers.filter((driver) => driver.status === 'ACTIVE');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.routeId || !form.vehicleId || !form.driverId) {
      setError('Select a route, vehicle and driver.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/transport/trips', {
        method: 'POST',
        body: JSON.stringify({
          routeId: form.routeId,
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          date: new Date(`${form.date}T${form.time || '07:00'}:00`).toISOString(),
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not schedule the trip.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Schedule trip"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="trip-form" isLoading={saving}>
            Schedule trip
          </Button>
        </>
      }
    >
      <form id="trip-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {routes.length === 0 || vehicles.length === 0 || availableDrivers.length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            You need at least one active route, one vehicle and one active driver before scheduling a trip.
          </p>
        ) : (
          <>
            <Select
              label="Route *"
              value={form.routeId}
              options={[
                { value: '', label: 'Select route' },
                ...routes.map((route) => ({ value: route.id, label: route.name })),
              ]}
              onChange={(event) => setForm({ ...form, routeId: event.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Vehicle *"
                value={form.vehicleId}
                options={[
                  { value: '', label: 'Select vehicle' },
                  ...vehicles
                    .filter((vehicle) => !['RETIRED', 'OUT_OF_SERVICE'].includes(vehicle.status))
                    .map((vehicle) => ({
                      value: vehicle.id,
                      label: `${vehicle.registrationNumber} (${vehicle.seatingCapacity} seats)`,
                    })),
                ]}
                onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}
              />
              <Select
                label="Driver *"
                value={form.driverId}
                options={[
                  { value: '', label: 'Select driver' },
                  ...availableDrivers.map((driver) => ({
                    value: driver.id,
                    label: `${driver.staff?.firstName ?? ''} ${driver.staff?.lastName ?? ''}`.trim(),
                  })),
                ]}
                onChange={(event) => setForm({ ...form, driverId: event.target.value })}
              />
              <Input
                label="Trip date *"
                type="date"
                required
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
              <Input
                label="Departure time"
                type="time"
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

function MaintenanceModal({
  vehicles,
  onClose,
  onSaved,
}: {
  vehicles: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'Scheduled service',
    scheduledDate: new Date().toISOString().slice(0, 10),
    cost: '',
    provider: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.vehicleId) {
      setError('Select a vehicle.');
      return;
    }
    if (!form.type.trim()) {
      setError('Enter the maintenance type.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/transport/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          type: form.type.trim(),
          scheduledDate: new Date(`${form.scheduledDate}T00:00:00`).toISOString(),
          cost: form.cost.trim() ? Number(form.cost) : undefined,
          provider: form.provider.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not schedule maintenance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Schedule vehicle maintenance"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="maintenance-form" isLoading={saving}>
            Schedule maintenance
          </Button>
        </>
      }
    >
      <form id="maintenance-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {vehicles.length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            Register a vehicle before scheduling maintenance.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Vehicle *"
                value={form.vehicleId}
                options={[
                  { value: '', label: 'Select vehicle' },
                  ...vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: `${vehicle.registrationNumber} — ${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim(),
                  })),
                ]}
                onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}
              />
              <Select
                label="Maintenance type *"
                value={form.type}
                options={MAINTENANCE_TYPES.map((type) => ({ value: type, label: type }))}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              />
              <Input
                label="Scheduled date *"
                type="date"
                required
                value={form.scheduledDate}
                onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}
              />
              <Input
                label="Estimated cost (GH₵)"
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(event) => setForm({ ...form, cost: event.target.value })}
              />
              <Input
                label="Provider / garage"
                value={form.provider}
                onChange={(event) => setForm({ ...form, provider: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="maintenance-description" className="block text-xs font-semibold text-charcoal-800">
                Description
              </label>
              <textarea
                id="maintenance-description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <p className="text-[11px] text-warm-500">
              Scheduling maintenance marks the vehicle as in maintenance until the job is completed.
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}

function FuelModal({
  vehicles,
  onClose,
  onSaved,
}: {
  vehicles: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().slice(0, 10),
    fuelType: 'Petrol',
    quantity: '',
    unitPrice: '',
    supplier: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = Number(form.quantity || 0) * Number(form.unitPrice || 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.vehicleId) {
      setError('Select a vehicle.');
      return;
    }
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError('Unit price cannot be negative.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/transport/fuel', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          date: new Date(`${form.date}T00:00:00`).toISOString(),
          fuelType: form.fuelType.trim(),
          quantity,
          unitPrice,
          supplier: form.supplier.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not record the fuel purchase.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Record fuel purchase"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="fuel-form" isLoading={saving}>
            Record purchase
          </Button>
        </>
      }
    >
      <form id="fuel-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {vehicles.length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            Register a vehicle before recording fuel purchases.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Vehicle *"
                value={form.vehicleId}
                options={[
                  { value: '', label: 'Select vehicle' },
                  ...vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: `${vehicle.registrationNumber} — ${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim(),
                  })),
                ]}
                onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}
              />
              <Input
                label="Purchase date *"
                type="date"
                required
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
              <Input
                label="Fuel type *"
                required
                value={form.fuelType}
                onChange={(event) => setForm({ ...form, fuelType: event.target.value })}
              />
              <Input
                label="Quantity (litres) *"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              />
              <Input
                label="Unit price (GH₵) *"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.unitPrice}
                onChange={(event) => setForm({ ...form, unitPrice: event.target.value })}
              />
              <Input
                label="Supplier"
                value={form.supplier}
                onChange={(event) => setForm({ ...form, supplier: event.target.value })}
              />
            </div>
            <p className="rounded-lg bg-ivory-50 p-3 text-sm font-semibold text-charcoal-900">
              Total cost: {money(total)}
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}
