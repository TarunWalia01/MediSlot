# MediSlot Progress

## Current phase

Phase 4 — Scheduling and appointment booking implementation complete; manual API and Compass verification pending

## Next phase

Phase 5 — Frontend workflow completion and broader integration (not started; wait for explicit Phase 4 confirmation)

## Completed

- Inspected the workspace and read `.github/copilot-instructions.md`.
- Set up the React + Vite frontend and Express backend.
- Added Axios health-check integration from React to Express.
- Added Mongoose Atlas connection configuration and a database-aware health endpoint.
- Added local environment files and tracked example templates without real credentials.
- Configured `.gitignore` and initialized Git.
- Created all five Mongoose models with validation, timestamps, references, embedded slot documents, and indexes.
- Added patient registration/login, bcrypt password hashing, JWT creation/verification, current-user lookup, and role authorization.
- Added an environment-driven admin seed script; public registration always assigns the `patient` role.
- Added an admin-only authorization smoke-check endpoint at `GET /api/admin/health`.
- Added frontend authentication context, Axios auth methods with bearer tokens in `sessionStorage`, and a protected-route component used by the account route.
- Added login and patient-registration pages with field validation, visible password toggles, API error messages, and no role selector.
- Added React routes for home, login, registration, and a minimal protected account page. The home route retains the backend/database health panel; unauthenticated access to `/account` redirects to `/login`.
- Added navigation-based logout and login redirect. Authenticated-user restoration uses `GET /api/auth/me`; registration returns to login rather than storing a token because the registration API does not issue one.
- Added a model registry imported during server startup so all five Mongoose models are registered.
- Added a duplicate-slot preflight and explicit Appointment index creation/verification after the database connects. Startup now fails before listening if the preflight or required index initialization fails.
- Added public doctor and service read APIs plus admin-only create, update, and soft-deactivate APIs. The existing Doctor and Service schemas and their unique indexes are reused.
- Added doctor name/specialization search, specialization and service filters, sorting, fee filtering for services, and validated pagination.
- Added populated doctor service references, safe profile-image URL validation, request-field allowlists, and handling for duplicate, invalid-ID, missing-record, and schema-validation errors.
- Added optional JWT authentication only to public read routes so administrators can request inactive records; writes remain protected by the existing `authenticate` and `authorizeRoles('admin')` middleware.
- Added React doctor listing/detail and services pages with API-backed search, filters, sorting, pagination, and loading/error/empty states.
- Added an admin-only doctor and service manager with create/edit, deactivate, and reactivate actions. Deactivation is soft so existing references are retained.
- Added React API methods and navigation/routes for the new Phase 3 pages. The Phase 1 health page and Phase 2 authentication implementation were preserved.
- Added date-specific doctor schedule management with clinic weekdays, working hours, slot duration, break periods, generated UTC slots, and admin create/edit/deactivate operations.
- Added public available-slot retrieval and admin schedule listing. The backend rejects invalid/past dates, invalid or overlapping breaks, unavailable weekdays, and edits to schedules that already contain bookings.
- Added patient appointment booking, ownership-scoped history and cancellation, and admin appointment listing/status management with filtering and pagination.
- Added server validation for active doctor/service references, service-to-doctor assignment, past slots, exact generated-slot matching, and overlapping appointment intervals.
- Added a `scheduleId` appointment reference so cancellation/rejection can release the exact claimed schedule slot. The status and slot release are committed in one MongoDB transaction when supported; the standalone fallback uses an atomic slot claim and explicit compensating release/rollback.
- Kept the active appointment partial unique index and added a supporting overlap-query index. Startup now creates and verifies the unique doctor/date schedule index and initializes/verifies Appointment indexes without `syncIndexes()`.
- Added frontend doctor availability selection and booking, a patient appointment dashboard with status counts/cancellation, and admin schedule and appointment management screens.
- Added shared clinic-timezone formatting. Backend and frontend examples use `Asia/Kolkata`; the backend converts clinic-local schedule times to UTC instants.
- Added focused Node.js tests for clinic-time conversion, break-aware slot generation, invalid local times, schedule validation, integer service duration, and the active appointment index definition.

## Decisions

- Use JavaScript, regular CSS, Axios, and React Router DOM as required.
- Use Node.js built-in `--watch` mode; Nodemon is not used.
- The health endpoint reports backend and database connection status.
- Keep local `.env` files out of Git and commit only `.env.example` templates.
- Use `bcryptjs` for bcrypt-compatible password hashing and `jsonwebtoken` for signed bearer tokens.
- Store tokens in `sessionStorage`: tokens are cleared when the tab closes, but remain accessible to JavaScript and are therefore still exposed to XSS.
- Store schedule/appointment clinic dates as `YYYY-MM-DD` keys, schedule working-hour configuration as clinic-local `HH:mm`, and slot/appointment instants as UTC `Date` values. Configure the clinic timezone with `CLINIC_TIME_ZONE` and matching `VITE_CLINIC_TIME_ZONE`.
- Schedules are date-specific, matching the existing Schedule model. A unique `{ doctorId, date }` index prevents duplicate daily schedules; server-generated slots are the only slots the booking API accepts.
- Appointment booking claims a schedule slot and writes its appointment in a transaction when the connected MongoDB topology supports transactions. Otherwise, an atomic conditional schedule update prevents a second claim, with compensating cleanup on a failed appointment write.
- Cancellation and rejection transition the appointment and release its exact embedded schedule slot in the same transaction, or restore the previous status if fallback cleanup fails. Confirmed and completed appointments continue to occupy their slots.
- A service duration must be a whole number and cannot exceed its selected schedule slot. The slot remains reserved for its full configured block, even if the selected service is shorter.
- Keep the active-booking partial unique index for pending, confirmed, and completed appointments. Startup checks for duplicate matching appointments before index creation and verifies both required unique indexes. `syncIndexes()` is not used.
- Disabled automatic index creation only for Appointment so duplicate preflight runs before the unique index build; server startup explicitly creates and reads back the index. No `syncIndexes()` is used.
- Admin setup only creates an admin from local `ADMIN_*` environment values. It never promotes an existing patient.
- `GET /api/admin/health` is a small protected smoke-check endpoint so role authorization can be verified before admin modules are added.
- Public doctor/service listing endpoints return active records by default. `includeInactive=true` requires an administrator token so admin managers can edit or reactivate deactivated records.
- `DELETE /api/doctors/:id` and `DELETE /api/services/:id` deactivate records instead of removing them, preserving future schedule, appointment, and doctor/service references.
- Collection responses use `{ success, data, pagination }`; pagination is bounded to 100 records per request. Sort fields are allowlisted.

## Commands and test results

- `npm install bcryptjs jsonwebtoken` in `backend/` — passed; npm reported zero vulnerabilities.
- `npm run build` in `frontend/` — passed after auth context integration.
- `node --check` for all backend JavaScript files — passed.
- Model registry check — passed; User, Doctor, Service, Schedule, and Appointment are registered, and Appointment schema `autoIndex` is disabled.
- In-memory Mongoose validation checks — passed for normalized user email, default patient role, password exclusion from JSON, doctor/service validation, valid and invalid clinic dates, overlapping schedule slots, default appointment status, and the active-booking index definition.
- Reloaded the running frontend in the integrated browser — passed; the React health panel displayed backend `ok` and MongoDB `connected`.
- A second backend start attempt reported port 5000 already in use; the existing backend was already listening and serving the health status. The temporary duplicate process was stopped.
- Fresh backend startup on port 5001 — passed: MongoDB connected, duplicate appointment-slot preflight passed, `Appointment.createIndexes()` completed, and `Appointment.collection.indexes()` confirmed the unique compound index and expected partial filter before the API listened.
- No appointment documents were inserted. The temporary verification backend was stopped after startup/index verification.
- `npm run build` in `frontend/` and `git diff --check` — passed for this correction.
- `npm run build` in `frontend/` — passed after adding the login, registration, and protected account routes.
- `node --check` across all 16 backend JavaScript files — passed.
- `git diff --check` — passed after the frontend authentication changes.
- Frontend auth interactions and auth API calls were not exercised in a browser or Thunder Client during this update. Do not treat registration, login, logout, `/api/auth/me`, invalid-token, or role checks as newly tested.
- GitHub push — not performed.
- Thunder Client HTTP tests — remain unrun; do not treat auth endpoints as API-tested.
- Atlas persistence/Compass checks for the new collections — not run; no test patient or admin account was created.
- Local `backend/.env` does not yet contain `JWT_SECRET` (only the variable name was checked). Set it locally before login tests. No `.env` values were displayed or changed.
- Admin seed guard — refused to proceed because `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, and `ADMIN_PASSWORD` are unset; validation occurs before connecting to MongoDB. No account was created.
- `npm run build` in `frontend/` after Phase 3 integration — passed.
- `node --check` across all 21 backend JavaScript files — passed.
- Shared list-query helper checks — passed for valid sorting/pagination, invalid page rejection, and regular-expression escaping.
- `git diff --check` — passed after Phase 3 implementation.
- Phase 3 REST endpoints were not exercised in Thunder Client and no Phase 3 documents were verified in Compass. Do not treat doctor/service CRUD, filtering, authorization, duplicate handling, or persistence as API-tested.
- Phase 2 authentication APIs remain unverified in Thunder Client as recorded above; frontend auth interactions were not re-tested during this phase.
- `npm test --prefix backend` — passed; 7 focused tests cover time-zone conversion, break-aware slots, invalid time/date handling, schedule overlap/validation, integer service durations, and the partial unique index definition.
- `node --check` across all 28 backend JavaScript files — passed.
- `npm run build --prefix frontend` — passed after Phase 4 pages and API integration.
- `git diff --check` — passed after Phase 4 changes.
- Backend started with `npm run dev` on temporary port 5017 — MongoDB connected, the Atlas topology reported transaction support, schedule and appointment indexes initialized and verified, and the API reached its ready log. No appointment records were inserted. The temporary server was stopped after verification.
- Thunder Client HTTP tests were not run in this environment. Do not treat scheduling, booking, cancellation, ownership, role checks, status transitions, or concurrent booking as API-tested.
- MongoDB Compass checks and a simultaneous two-request booking test remain manual. The frontend build does not verify its authenticated browser/API flows.
- No Phase 4 test patients, doctors, services, schedules, or appointments were created for verification. The local Atlas database remains free of test bookings from this implementation.
- On a MongoDB deployment without transaction support, booking uses an atomic slot claim and compensating cleanup. A process crash between the claim and appointment insert fails closed (the slot stays unavailable) and may require administrator cleanup; the configured Atlas deployment was verified to support transactions.
- GitHub push — not performed.

## Next steps

1. In Thunder Client, use a patient token to request `GET /api/schedules/:doctorId?date=YYYY-MM-DD`, book an available returned slot, and confirm the saved Appointment and booked Schedule slot in Compass.
2. Send two booking requests for the same returned slot as close together as possible; only one should return `201`, with the other returning `409`.
3. Verify missing/invalid token, admin attempting patient booking, invalid IDs, past dates/times, unavailable slots, inactive references, and a service longer than its slot.
4. Verify patient-only `GET /api/appointments/my`, owner-scoped `GET /api/appointments/:id`, patient cancellation, and that cancelling a pending/confirmed appointment releases its slot for a new booking.
5. With an admin token, test `POST/PUT/DELETE /api/schedules`, `GET /api/schedules/admin`, both admin appointment-list paths (`/api/appointments` and `/api/admin/appointments`), and allowed/denied status transitions. Confirm rejected/cancelled slots release and completed slots remain occupied.
6. In MongoDB Compass, inspect Schedule/Appointment references and confirm the schedule unique `{ doctorId, date }` index plus the partial unique active-slot index are present.
7. Re-run the pending Phase 2 authentication and Phase 3 doctor/service API tests as needed; their earlier untested status is unchanged.
8. Do not start Phase 5 until Phase 4 manual verification is complete and explicitly confirmed.
