# MediSlot Project Explanation

This document describes how the current repository implements MediSlot. It is intended to help the project team explain the actual code and data flow during a demonstration or viva.

## 1. Application architecture

MediSlot has three main parts:

1. **React frontend** renders public, patient, and admin pages. React Router selects the page, while `frontend/src/services/api.js` wraps Axios calls to the backend.
2. **Express backend** exposes JSON endpoints under `/api`. Routes apply authentication and role middleware before calling controllers.
3. **MongoDB** stores users, doctors, services, schedules, and appointments. Mongoose defines schemas, validates documents, and provides queries and references.

Typical request flow:

```text
React page -> Axios function -> Express route -> middleware -> controller
           -> Mongoose model -> MongoDB
           <- JSON response <- controller
```

For example, the doctor list page calls `getDoctors()` in `frontend/src/services/api.js`. The request reaches `GET /api/doctors`, where the doctor route calls the controller. The controller validates query options, builds MongoDB filters, populates service details, and returns a paginated JSON response.

The backend entry point is `backend/server.js`. It loads environment variables, configures CORS and JSON parsing, registers API routes, connects to MongoDB, and initializes/validates required schedule and appointment indexes before it starts listening.

## 2. Frontend pages and API integration

- `Home.jsx` requests backend health, featured doctors, and services. Its doctor search navigates to the doctor list with a query string.
- `Doctors.jsx` supports name/specialization search, service filtering, sorting, and pagination.
- `DoctorDetails.jsx` loads a doctor profile and offers available schedule slots to a signed-in patient.
- `Services.jsx` reads service information from the API.
- `Login.jsx` and `Register.jsx` use the authentication context rather than storing credentials inside the page.
- `PatientDashboard.jsx` displays the signed-in patient's appointments and cancellation controls.
- `AdminDashboard.jsx` reads protected dashboard counts.
- `AdminDoctors.jsx`, `AdminServices.jsx`, `AdminSchedules.jsx`, and `AdminAppointments.jsx` call the corresponding protected management APIs.

`ProtectedRoute.jsx` prevents a user without a current session from rendering a protected page. It also checks allowed roles. This is a user-interface convenience only; backend routes repeat the checks and are the actual security boundary.

## 3. Registration, login, and JWT authentication

### Registration

`POST /api/auth/register` accepts name, email, phone, and password. The controller trims and normalizes values, checks required formats and limits, and constructs the user with `role: 'patient'`. A role supplied by the browser is not used. The User model's pre-save hook hashes the password with bcryptjs before MongoDB stores it. A duplicate email returns `409`.

The response contains public user fields only. Password is excluded from normal Mongoose queries and removed from JSON; the controller also builds an explicit public user object.

### Login

`POST /api/auth/login` normalizes the email and loads the password hash only for the comparison. The model's `comparePassword()` method checks the candidate password with bcrypt. When credentials are valid and the account is active, `createAuthToken()` signs a JWT using `JWT_SECRET` and the configured expiration. Incorrect credentials return the same `401` response so account existence is not disclosed.

The frontend saves the returned token in `sessionStorage`. This is simple for an academic SPA and clears the token when the browser tab closes, but JavaScript can still read it; a cross-site scripting flaw could expose it. The token must never be logged or put in source control.

### Protected requests

An Axios request interceptor reads the session token and adds:

```http
Authorization: Bearer <token>
```

`authenticate` verifies the JWT, validates its user ID, reloads the account from MongoDB, and rejects missing or inactive users. `authorizeRoles('admin')` then checks the role. Missing/invalid authentication returns `401`; an authenticated user with the wrong role receives `403`.

`GET /api/auth/me` returns the current user's public fields. `AuthContext` uses it at app startup to restore the current user from the token. Logout removes the token and clears the in-memory user.

## 4. Mongoose models and relationships

The five models are registered through `backend/models/index.js` and imported during startup.

| Model | Important data | Relationship approach |
|---|---|---|
| `User` | Name, normalized unique email, password hash, phone, role, active state | Separate user documents let appointments refer to a patient without copying credentials/profile data. |
| `Doctor` | Contact/profile, specialization, qualifications, experience, fee, active state | `services` is an array of Service ObjectId references because services are separately managed and reused. |
| `Service` | Unique name, description, fee, duration, active state | Stored separately because multiple doctors can offer one service and admins manage it independently. |
| `Schedule` | Doctor, clinic date, weekday, working hours, breaks, duration, slots | References a Doctor. Slot entries are embedded because their lifecycle belongs to one date-specific schedule. |
| `Appointment` | Patient, Doctor, Service, Schedule, date, time interval, status, reason | References the four related records; the time interval is embedded because it is a small part of an appointment. |

Mongoose `populate()` is used where the interface needs related display fields, such as a doctor's services or the doctor/service/patient on an appointment. Controllers select only the fields needed for the response where practical.

Most schemas use timestamps. The User password field uses `select: false`. Soft deactivation is used for doctors, services, and schedules so old references and appointment history are retained.

### Important indexes

- User email is unique.
- Doctor email is unique; specialization and active state support common filters.
- Service name is unique; active state and name support list queries.
- Schedule `{ doctorId, date }` is unique so one doctor has at most one date-specific schedule.
- Appointment has patient/date, doctor/date/status, and schedule/status query indexes.
- Appointment has a partial unique index on `{ doctorId, appointmentDate, timeSlot.startTime }` for `pending`, `confirmed`, and `completed` records.

Appointment automatic indexing is disabled on its schema. Server startup checks for duplicate matching appointments, explicitly calls `Appointment.createIndexes()`, and verifies the index. It does not use `syncIndexes()`, which could reconcile or remove indexes unexpectedly.

## 5. Schedule and availability

Schedules are date-specific rather than recurring templates. An admin chooses the doctor, clinic calendar date, working-hour range, slot duration, and optional break ranges.

The schedule controller validates that the date is real and not in the past, that the weekday matches doctor availability, that working hours are ordered, and that breaks fall inside working hours without overlap. It then generates slots that fit the requested duration and skips breaks. Slot times are stored as UTC `Date` values. The configured clinic timezone controls the conversion from local `HH:mm` schedule times.

`GET /api/schedules/:doctorId` returns future active schedules and only future, unbooked slots. The response includes local display strings for the frontend. The frontend is allowed to display availability, but the backend revalidates every slot when booking.

## 6. Booking correctness and concurrency

`POST /api/appointments` is patient-only. The controller validates the booking payload, then checks:

1. The doctor, service, and schedule exist and are active.
2. The selected service is offered by the doctor.
3. The schedule belongs to that doctor and is not in the past.
4. The requested start is exactly one of the schedule's generated slots.
5. The slot is not already claimed and is not in the past.
6. The service duration fits the slot.
7. There is no appointment interval overlapping the requested interval.

The overlap query uses interval comparisons: an existing appointment overlaps when its start is before the new end and its end is after the new start. This catches overlapping intervals even if their start times differ.

The backend detects whether the MongoDB topology supports transactions. On Atlas deployments that support them, appointment creation and the conditional schedule-slot claim run in one transaction. In the transaction, the schedule update requires a matching unbooked slot; only one concurrent request can claim it. If the transaction is unavailable, the controller still uses that atomic conditional update, then saves the appointment and compensates by releasing the slot if saving fails.

The partial unique appointment index adds database enforcement for the same doctor's active appointment start. The schedule unique index and atomic slot claim protect the normal generated-slot workflow. The overlap query is an additional validation layer, not a substitute for the atomic claim. Confirmed and completed appointments continue to reserve their slots. Cancellation and rejection release the exact slot; completed appointments remain in history.

## 7. Appointment permissions and status transitions

- `GET /api/appointments/my` always filters by the authenticated patient ID.
- `GET /api/appointments/:id` checks ownership for patients; an appointment belonging to someone else is reported as not found.
- `PATCH /api/appointments/:id/cancel` uses the authenticated patient ID and permits only eligible patient cancellation.
- Admins list appointments with `GET /api/appointments` and update status using `PATCH /api/appointments/:id/status`.
- The role middleware protects admin routes on the server. Hiding an admin link in React is not treated as authorization.

Supported statuses are `pending`, `confirmed`, `rejected`, `cancelled`, and `completed`. The controller validates allowed transitions. Rejection and cancellation release schedule availability; completion retains it.

## 8. Admin dashboard

`GET /api/admin/dashboard` is protected by both JWT authentication and the admin role middleware. Its controller counts active doctors, patient accounts, all appointments, and appointments grouped by status. The React admin dashboard displays these figures and links to the existing doctor, service, schedule, and appointment management pages.

## 9. Errors and validation

Controllers validate IDs, query parameters, allowlisted fields, pagination, status values, and domain rules before writing to MongoDB. Mongoose performs a second validation layer. Responses use JSON with a `success` flag and a useful message; duplicate and conflict cases use appropriate client error statuses such as `409`. Authentication failures do not expose tokens or passwords. Production errors should not include stack traces or environment values.

## 10. Verification notes and known scope

The backend's focused Node.js tests cover time-zone conversion, schedule slot generation, schedule validation, service duration validation, and the active appointment index definition. Build, syntax, and diff checks are also run during development.

Thunder Client API workflows and MongoDB Compass document checks require a configured local Atlas environment and are manual checks. The final project documentation must distinguish these from automated checks. The current management UI covers doctors, services, schedules, and appointments; a dedicated admin patient-management screen is not part of this implementation.
