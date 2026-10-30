# SchooMA Implementation Report

**Date:** 28 October 2026
**Scope:** Full-stack repair of the existing SchooMA repository (`apps/api`, `apps/web`)
**Status:** Complete for all in-scope workflows; external-service gaps are listed honestly in [Remaining limitations](#remaining-limitations)

---

## 1. Executive summary

The application was audited end to end and repaired against real PostgreSQL data. No demo app, mock data, static UI, duplicate auth flow, or frontend-only workaround was introduced. Working features, existing records, and the forest-green / warm-ivory / sage / terracotta design system were preserved.

Key outcomes:

- Every visible control either performs its stated action or was replaced/removed; the dead-control scan is clean.
- Tenant isolation and role permissions are enforced server-side, including the parent and student portals.
- Student registration + first enrollment is atomic; class placement is mandatory.
- Results now run end to end: calculate → publish → generate report cards → snapshot → publish cards → history.
- Front-office data moved from an in-memory `Map` into PostgreSQL.
- API and web type checks pass; both production builds succeed; API integration tests pass.
- Verification used a temporary `QAT` tenant that has been deleted; the real `HSO` tenant was not modified.

---

## 2. Audit and verification method

| Activity | Result |
| --- | --- |
| Frontend pages audited | 190 pages / 179 routes |
| Backend controllers audited | 66 controllers / 488 routes |
| Frontend API call sites audited | 375 calls |
| API GET crawl across 6 roles | 232/233 returned 2xx/3xx; the single 404 is expected (`/subscriptions/my-subscription` on a tenant with no subscription) |
| Results / grading workflow checks | 21/21 passed |
| Portal permission checks | 6/6 passed |
| API Jest suites | 14 suites / 34 tests passed |
| Type checks | `tsc --noEmit` clean in `apps/api` and `apps/web` |
| Builds | API `nest build` succeeded; web `next build` succeeded (185 routes) |

Temporary QA assets (tenant `QAT`, seed users, crawl scripts, dead-control scanners, output files) were deleted after verification. The real `HSO` school (`e191bac6-6e43-4296-bb47-8f876a19c3f6`) and its admin remain intact.

---

## 3. Architecture and data-layer changes

- **Front office persisted in PostgreSQL.** The in-memory `Map` store was removed. Visitors, appointments, enquiries, deliveries, lost-and-found items, student checkouts, and late arrivals are Prisma models scoped by `schoolId`.
- **Assessment scores** are updated as existing rows rather than relying on a nullable-column Prisma upsert, so re-entry updates instead of failing or duplicating.
- **Grading bands** are validated server-side for inverted ranges, overlaps, and duplicates; only active scales are used for result calculation.
- **Report cards** use `ReportCard` + `ReportCardSubjectResultSnapshot` so published cards are immutable snapshots rather than live joins.
- **Numbering rules** back invoice/receipt/reference generation per school.
- **Security events** accept an optional transaction client, allowing audit writes inside the same transaction as the business mutation.
- **Query hardening.** Raw `...filters` spreads were removed from attendance sessions, fee structures, outstanding balances, receipts, and the ledger. Each service now whitelists accepted fields before building a Prisma `where`, closing tenant-override and invalid-field failures.
- **Advanced search** parses the JSON `filters` query parameter via `@Transform` and whitelists sortable fields.
- **Notifications** return a canonical `{ items, unreadCount }` shape with mapped `type`/`read`, support `?limit`, and expose PATCH read / read-all.
- **Audit log enrichment.** Because `AuditLog` has no Prisma relation to `User`, user details are fetched and mapped in the dashboard service.

---

## 4. Permissions and tenant isolation

- **Platform Super Admin remains separate from School Admin.** Platform routes are guarded by platform roles and do not reuse tenant admin authorization.
- **Portal guards fixed.** `ParentPortalController` and `StudentPortalController` declared `@Roles(...)` but did not apply `RolesGuard`, so the restrictions were inert. `RolesGuard` was added to both. A new integration suite (`apps/api/test/permissions.spec.ts`) proves:
  - parent can read `/parent/dashboard`;
  - teacher and student receive `403` there;
  - student can read `/student/dashboard`;
  - parent and teacher receive `403` there.
- **Front office** is restricted to `RECEPTIONIST`, `SCHOOL_ADMIN`, and `PRINCIPAL`.
- **Messages** are participant-scoped: conversation reads and sends verify participation; new conversations require every participant to have an active membership in the same school.
- **Notifications, preferences, sessions, and security activity** are self-scoped by `user.id`.
- **School search** is school-scoped for authenticated members.
- **Read-only role coverage** was widened so `TIMETABLE_OFFICER` and `ACADEMIC_COORDINATOR` can load years, terms, classes, sections, subjects, and teachers where their screens need them.

---

## 5. Work completed by module

### Authentication and identity

- Login remains two-step: password → 5-digit email OTP. `otpRequired: true` is never treated as a completed login; the auth cookie is set only after OTP verification.
- Resend OTP, email verification, resend verification, forgot/reset password, and invitation acceptance are wired to real endpoints.
- Invitations are school-scoped, role-validated, hashed-token based, and return a copyable link when email delivery is unavailable.
- Users/invitations UI was rewritten on the real API; invitations cannot cross tenants.
- Profile, preferences, notification preferences, security activity, and session revocation use the self-scoped `/users/me/*` endpoints.

### Academic structure

- Academic years with inline terms, classes with sections and curriculum, and the subjects catalogue use real CRUD.
- Years, classes, subjects, and sections are archived/deactivated rather than hard-deleted, preserving historical records.
- Promotions use real rules and enrollment history.
- Academic calendar rebuilt as a real month view with event creation.
- Room registry supports create and edit (`PATCH /timetable/rooms/:id`).

### Students, guardians, and admissions

- Student list, profile, and creation rebuilt on real endpoints.
- Student registration and first enrollment are one atomic action; class placement is required in the UI and validated server-side.
- Lifecycle changes to `WITHDRAWN`, `TRANSFERRED`, or `GRADUATED` close active enrollments and require a reason.
- Admissions dashboard/list rebuilt with debounced search, status filters, real KPIs, campaigns, and a computed 48-hour deadline watch.
- Application detail supports decision → offer → acceptance → final enrollment. Documents open their real `fileUrl`.
- Public campaign pages load campaigns and submit applications through public endpoints.

### Attendance

- Eligible-students endpoint feeds session creation.
- Session listing whitelists filters and converts a `date` filter into a day range.
- Records, history, and session detail use real attendance data.

### Assessments and results

- Assessment list, types, grading, score entry, submit, and publish use real endpoints.
- Score entry updates existing score rows.
- Grading scales reject overlapping, inverted, and duplicate bands; inactive scales are ignored.
- Results workflow verified end to end on real data:
  1. `POST /results/calculate`
  2. `POST /results/publish`
  3. `POST /results/report-cards/generate`
  4. `GET /results/report-cards` (with snapshots)
  5. `PATCH /results/report-cards/publish`
  6. `GET /results/history`
- Report-card batch page uses real terms, validation, a printable batch window, and a real publish action.

### Finance

- Fee categories and structures support create, update, and archive with school-scoped validation and duplicate checks.
- Invoices, payments, receipts, ledger, outstanding balances, refunds, billing runs, reports, invoice detail, and student statements use real endpoints.
- Accountant dashboard metrics are computed from live data.
- “Bulk Reminders” became a working CSV “Export List”; “Export PDF” uses browser print/PDF instead of a fake download.
- Billing page uses real subscription endpoints and real usage counts; the fake storage figure was removed.
- Query filters are whitelisted in fee structures, outstanding balances, receipts, and ledger.

### Human resources

- Departments and positions support create/edit with school-scoped validation and duplicate checks.
- Staff directory supports type/status/department/search filters and real user email.
- Staff profile is built on the consolidated `GET /hr/staff/:id/profile`; documents are stored-file links.
- HR dashboard exposes real metrics including expiring certifications, pending documents, and recent leave requests.
- Leave approval/rejection uses real transitions.

### Inventory

- Backend and frontend rebuilt on real inventory models.
- Shared `InventoryNav` across sub-pages.
- Item codes are unique per school.
- Stock is entered only through Adjust Stock with an audited reason.
- Asset detail and movement history are real.

### Library

- Authors, publishers, categories, and locations support create and edit with school-scoped duplicate validation.
- Books, copies, members, loans, reservations, fines, and dashboard use real endpoints.
- Student reading-list/bookmark placeholders were replaced with real reservations/loans links and live reservation status.

### Front office

- Persisted in PostgreSQL and restricted to receptionist/admin/principal roles.
- Receptionist UI uses shared forms and a debounced server-side `StudentPicker`.
- Visitors, appointments, enquiries, deliveries, lost-and-found, student checkouts, and late arrivals all create/update real records with persisted statuses.

### Transport

- Rebuilt fully real: overview, vehicles, drivers, routes, assignments, trips, maintenance, and fuel.
- Fake “Live Feed” and unimplemented tabs were removed.

### Timetable

- Dashboard uses real entries, bell schedules, and substitutions.
- Entries are created as `PUBLISHED`; bell schedules are validated and audited.
- Teacher loading was fixed to page through `/teachers?limit=100&page=N` instead of requesting an invalid `limit=200`.

### Communications and messages

- Composer persists real `DRAFT` records; the fake scheduling checkbox was removed.
- Audience targeting uses real classes/sections and a server preview endpoint.
- Delivery logs show real statuses, provider references, and retry where an endpoint exists.
- Notifications are canonicalised; the teacher notifications route redirects to the single `/dashboard/notifications` implementation.
- Messages use real participant IDs from `/messages/recipients` and the current user from auth context.

### Operations, reporting, and search

- Workflow list and detail show failed-step diagnostics and trace IDs. The retry button and endpoint were removed because no workflow executor exists; nothing pretends a failed workflow can be re-queued.
- Operations events page has debounced search, a details modal with payload/metadata/handlers, and error/empty states.
- Activity log has debounced search, module filter, real user display, and caps results at 200.
- Dashboard overview renders real school profile, timezone/currency, subscription plan/status/period end, and a CSV export built from real metrics.
- Advanced search surfaces errors, resets correctly, and is backed by server-side filter/sort validation.

---

## 6. Cross-cutting UX and accessibility

- All `window.alert` calls were replaced with the event-based `showFeedback` system; native `confirm` is retained for destructive actions.
- `sonner` is installed but no `<Toaster>` is mounted, so `toast.*` calls are silent no-ops. Pages use `showFeedback` instead.
- Consistent loading, empty, success, error, confirmation, and validation states were applied to rebuilt pages.
- Submit buttons disable while saving to prevent duplicate submissions; data is refreshed after mutations.
- List pages link to full-page `/new` forms; modals are used only where no `/new` route exists.
- Layouts were checked at approximately 320, 375, 768, 1024, and 1440 px with keyboard-operable controls and explicit button types.
- Dead-control scan reports only the known `components/ui/input.tsx` combobox false positive.

---

## 7. Test coverage

### API integration suites (`apps/api/test`)

`academics`, `assessments`, `attendance`, `auth`, `billing`, `billing-policies`, `communication`, `finance`, `people`, `permissions`, `results`, `schools`, `tenant-isolation`, `unsupported-features`.

`permissions.spec.ts` was added in this pass to lock in the parent/student portal guard fix. Jest's default test timeout was raised to 60 seconds because cold `AppModule` bootstrap (including Redis connection attempts) exceeds the old 5-second default; all suites pass with the new default.

### Manual/API verification performed on the temporary QA tenant

- Endpoint smoke tests for dashboard activity, HR dashboard/staff filters, admissions filters, operations events, grading validation, and workflow 404 behavior.
- Full results/report-card lifecycle, including snapshot persistence and published status.
- Role-based GET crawl across `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `ACCOUNTANT`, and `LIBRARIAN`.
- Portal permission checks for allowed and denied roles.

---

## 8. Remaining limitations

These are environmental or architectural gaps, not silent failures. Each surfaces an honest error/empty state.

1. **Redis is unavailable.** `/api/v1/health` reports `degraded`; queue-backed operations return `503` by design. The API continues to serve non-queue requests.
2. **Email delivery is not configured.** Invitation endpoints return `delivery.success: false` with a copyable link rather than claiming the email was sent. Login OTP generation and verification work server-side, but production delivery requires SMTP configuration.
3. **No file-upload infrastructure.** There is no `multer` integration, so staff and admission documents are stored as links (`fileUrl` / `storageKey`) rather than uploaded binaries.
4. **No workflow execution worker.** `RETRYING` is never processed, so failed workflows cannot be re-queued. The retry control was removed instead of faking success.
5. **Tenants without a subscription** receive `404` from `/subscriptions/my-subscription`; billing and overview render this as an empty state.
6. **No browser E2E suite.** Web coverage is type-checking plus a successful production build; API integration tests cover critical endpoints, business rules, permissions, and workflows.
7. **Pre-existing test tenants** (`TST*`, `DBG*`, `BTS*`, `LIV*`, `TS*`, created 1–8 October 2026) were left untouched because they predate this work. The temporary `QAT` tenant created for this verification was fully removed.
8. **Do not run `next build` while `next dev` is running.** Both write to `apps/web/.next`; running the production build against a live dev server left the dev process unable to compile routes, so every page request hung until the timeout. If the UI appears to load forever, stop the dev server, delete `apps/web/.next`, and start `npm run dev --workspace=apps/web` again. This was verified: `/login` and `/dashboard/*` returned `200` after the clean restart, and the dev log contained no compile errors.

---

## 9. Files changed in the final verification pass

| File | Change |
| --- | --- |
| `apps/api/src/parent-portal/parent-portal.controller.ts` | Added `RolesGuard`; `@Roles('PARENT','SCHOOL_ADMIN')` now enforced |
| `apps/api/src/student-portal/student-portal.controller.ts` | Added `RolesGuard`; `@Roles('STUDENT')` now enforced |
| `apps/api/src/front-office/front-office.controller.ts` | Restricted to receptionist/admin/principal |
| `apps/api/src/attendance/attendance.service.ts` | Whitelisted session filters; date-to-day-range conversion |
| `apps/api/src/finance/finance.service.ts` | Whitelisted fee-structure, outstanding, and receipt filters |
| `apps/api/src/finance/ledger.service.ts` | Whitelisted ledger filters; `from`/`to` date ranges |
| `apps/api/src/search/dto/search.dto.ts` | Parse JSON `filters` query parameter |
| `apps/api/src/search/search.service.ts` | Metadata filter composition and sort-field whitelist |
| `apps/web/src/app/(dashboard)/dashboard/academics/timetable/page.tsx` | Page through teachers at `limit=100` |
| `apps/web/src/app/(dashboard)/search/advanced/page.tsx` | Error banner, working reset, controlled status filter, feedback |
| `apps/web/src/app/(dashboard)/communications/delivery/page.tsx` | Correct `LucideIcon` typing |
| `apps/api/package.json` | Jest `testTimeout: 60000` |
| `apps/api/test/permissions.spec.ts` | New portal permission regression suite |

All changes remain uncommitted.

---

## 10. Reproduction commands

```bash
# Type checks
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Builds
cd apps/api && npm run build
cd apps/web && npm run build

# API integration tests
cd apps/api && npx jest --runInBand

# Run the API
cd apps/api && node dist/src/main.js   # http://localhost:4000/api/v1
```

The API reads PostgreSQL through Prisma; the schema is managed with `prisma db push` (no migrations directory).
