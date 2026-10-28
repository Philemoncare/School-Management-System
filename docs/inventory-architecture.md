# Inventory, Assets & Procurement Architecture

## Overview
The School Management platform's Resource Management system provides a comprehensive suite for tracking physical school property, consumables, and the procurement lifecycle.

## Core Pillars

### 1. Inventory & Stock Control
Manages quantity-based consumables (stationery, cleaning supplies, lab materials).
- **Item Catalog**: Global definition of what items exist.
- **Stock Locations**: Physical areas where items are stored.
- **Stock Movements**: Immutable ledger of every receipt, issue, transfer, or adjustment.
- **Inventory Balance**: Real-time available quantities per location.

### 2. Asset Management
Manages uniquely identifiable high-value property (laptops, vehicles, furniture).
- **Asset Register**: Tracking of individual units via unique tags.
- **Assignments**: Formal record of who (Staff/Dept) is currently responsible for an asset.
- **Maintenance**: History of repairs and service intervals.
- **Warranties**: Reminders and provider tracking.

### 3. Procurement Lifecycle
Workflow from internal need to stock receipt.
- **Purchase Requests**: Internal requisitions with approval workflows.
- **Supplier Registry**: Centralized database of authorized vendors.
- **Purchase Orders**: Financial snapshots and formal orders.
- **Goods Receipt**: The bridge between Procurement and Inventory; receiving items automatically updates stock levels.

## Security & Isolation
- **Tenant Context**: All records are strictly scoped to the `schoolId` of the authenticated user.
- **RBAC**: Granular permissions like `INVENTORY_MANAGE`, `ASSET_ASSIGN`, and `PROCUREMENT_APPROVE`.
- **Audit Trail**: All state changes are recorded with actor, timestamp, and correlation ID.

## Finance Integration
The module acts as a "Resource Authority" while Finance remains the "Accounting Authority". Procurement events (like Goods Receipt) emit signals for Finance to handle Payables and Invoice Matching without duplicating ledger logic.
