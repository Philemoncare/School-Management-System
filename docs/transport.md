# School Transportation Management System Architecture

## 1. Overview
The Transportation Management System (TMS) handles fleet operations, driver management, route logistics, and student transit tracking. It is fully integrated with the multi-tenant School ERP architecture.

## 2. Core Entities
- **Vehicle**: The physical asset. Tracks capacity, status, and maintenance.
- **Driver**: Linked to `Staff`. Tracks license validity and vehicle assignments.
- **Route**: A logical path with multiple `RouteStop` entries in sequence.
- **TransportAssignment**: Links a `Student` to a specific `Route` and stops.
- **TransportTrip**: An instance of an operational route execution.
- **TransportAttendance**: Boarding/Alighting logs per student per trip.

## 3. Safety & Constraints
1. **Capacity Enforcement**: Vehicles cannot exceed `seatingCapacity` during assignments.
2. **Conflict Prevention**: Drivers and Vehicles cannot be assigned to overlapping active trips.
3. **Tenant Isolation**: Every resource is hard-scoped to a `schoolId`.

## 4. Realtime & GPS
- GPS updates are received from driver devices during active trips.
- WebSocket events notify parents when a bus starts, approaches, or when a student boards/alights.
- Data retention: GPS history is kept for 30 days by default.

## 5. Finance Integration
Transport fees are generated based on `TransportAssignment` and integrated into the central School Finance ledger as specific fee categories.
