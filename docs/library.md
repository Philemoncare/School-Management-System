# Library Management & Book Circulation Architecture

## 1. Data Model & PostgreSQL Mapping
The system leverages the real multi-tenant PostgreSQL database via Prisma ORM:
- **LibraryConfiguration**: School-specific parameters tracking grace periods, limits (`maxActiveLoans`, `loanDurationDays`, `maxRenewals`, `dailyFineAmount`).
- **Book**: Bibliographic reference tracking title, subtitle, ISBN code, categories, and publisher.
- **BookCopy**: Individual tracking items using unique accession numbers and barcode codes rather than generic titles.
- **LibraryMembership**: Maps any existing `User` into an active library card context with autonomous alphanumeric identifier indices (`LIB-...`).
- **LibraryLoan**: Preserves historical logs of borrowings, due extensions, and return timestamps safely inside transactional boundaries.
- **LibraryFine**: Governs automated rule-based calculations whenever items pass past their due parameters.

## 2. Invariants Protected
1. **Concurrency Controls**: One physical `BookCopy` can never be simultaneously rented or assigned to two different active loan accounts.
2. **Status Lifecycles**: Lost, damaged, or withdrawn items can never be selected for an checkout transaction until explicitly cleared or recovered by authorized librarians.
3. **Tenant Scoping**: All operations, selections, lookups, and updates are entirely hard-bound to the logged-in `schoolId` context.
