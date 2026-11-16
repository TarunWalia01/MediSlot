# MediSlot

MediSlot is a MERN-stack doctor appointment booking application built as a B.Tech academic project. Patients can find doctors and services, view availability, book appointments, and manage their own bookings. Administrators can manage doctors, services, schedules, and appointment status.

## Features

- Patient registration and login with bcrypt password hashing and JWT authentication.
- Role-protected administrator routes and an environment-driven admin setup script.
- Doctor and service search, filtering, sorting, and pagination.
- Date-specific doctor schedules with clinic working hours, breaks, and generated appointment slots.
- Patient booking, appointment history, cancellation, and ownership checks.
- Admin appointment status management and dashboard statistics.
- MongoDB indexes and atomic schedule-slot claims to protect booking integrity.
- Responsive React pages with loading, error, and empty states.

## Technology

- Frontend: React 18, Vite, React Router, Axios, regular CSS.
- Backend: Node.js ES modules, Express, Mongoose.
- Database: MongoDB Atlas (MongoDB Compass can be used to inspect records and indexes).
- Authentication: `bcryptjs`, `jsonwebtoken`, bearer tokens.
- Development server: Node.js built-in `--watch`; Nodemon is not used.
- REST API manual testing: Thunder Client.

## Project structure

```text
MediSlot/
├── backend/
│   ├── config/                 # MongoDB and JWT configuration
│   ├── controllers/            # Auth, admin, doctor, service, schedule, appointment logic
│   ├── middleware/             # JWT authentication and role checks
│   ├── models/                 # User, Doctor, Service, Schedule, Appointment
│   ├── routes/                 # Express API routes
│   ├── scripts/createAdmin.js  # Controlled first-admin setup
│   ├── tests/                  # Focused Node.js tests
│   ├── utils/                  # Time-zone, list-query, and HTTP error helpers
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # DoctorCard, Footer, ProtectedRoute
│   │   ├── context/            # Authentication state
│   │   ├── pages/              # Public, patient, and admin pages
│   │   ├── services/api.js     # Axios API functions
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── PROJECT_EXPLANATION.md
├── VIVA_QUESTIONS.md
└── PROGRESS.md
```

## Requirements and setup

Use Node.js 20 LTS or newer and npm. Create a MongoDB Atlas cluster and allow the development machine to connect to it. Do not commit local `.env` files.

From the repository root in PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
npm install --prefix backend
npm install --prefix frontend
```

Edit `backend/.env` locally:

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/medislot?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1d
CLINIC_TIME_ZONE=Asia/Kolkata

# Required only when creating the first administrator:
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PHONE=
ADMIN_PASSWORD=
```

Edit `frontend/.env` locally if the API is not at its default address:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLINIC_TIME_ZONE=Asia/Kolkata
```

Use real Atlas credentials only in the ignored local environment file. Do not put database credentials, JWT secrets, or tokens in frontend environment variables. `VITE_*` values are shipped to the browser and are public.

To create the first administrator, fill in the `ADMIN_*` values in `backend/.env`, then run:

```powershell
npm run seed:admin --prefix backend
```

The script does not print the password or promote an existing patient account. Public registration always creates a patient.

## Run the application

Open two terminals at the repository root.

Backend:

```powershell
npm run dev --prefix backend
```

Frontend:

```powershell
npm run dev --prefix frontend
```

Open `http://localhost:5173`. The backend listens on `http://localhost:5000`; its health endpoint is `GET /api/health`.

For a normal backend start without watch mode, use:

```powershell
npm start --prefix backend
```

## API summary

All responses use JSON. List responses generally contain `success`, `data`, and pagination details. Protected routes use `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Backend and database status |
| POST | `/api/auth/register` | Public | Create a patient account |
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Signed-in user | Return the current user |
| GET | `/api/doctors` | Public | Search/filter/sort/paginate active doctors |
| GET | `/api/doctors/:id` | Public | View a doctor and populated services |
| POST, PUT, DELETE | `/api/doctors`, `/api/doctors/:id` | Admin | Create, update, or deactivate doctors |
| GET | `/api/services` | Public | Search/filter/sort/paginate active services |
| GET | `/api/services/:id` | Public | View a service |
| POST, PUT, DELETE | `/api/services`, `/api/services/:id` | Admin | Create, update, or deactivate services |
| GET | `/api/schedules/:doctorId?date=YYYY-MM-DD` | Public | View future unbooked slots |
| GET | `/api/schedules/admin` | Admin | List schedules, including inactive ones |
| POST, PUT, DELETE | `/api/schedules`, `/api/schedules/:id` | Admin | Create, update, or deactivate schedules |
| POST | `/api/appointments` | Patient | Book an available slot |
| GET | `/api/appointments/my` | Patient | View the signed-in patient's appointments |
| GET | `/api/appointments/:id` | Owner or admin | View an appointment |
| PATCH | `/api/appointments/:id/cancel` | Owner patient | Cancel an eligible appointment |
| GET | `/api/appointments` | Admin | Filter and page through all appointments |
| PATCH | `/api/appointments/:id/status` | Admin | Confirm, reject, cancel, or complete an appointment |
| GET | `/api/admin/dashboard` | Admin | Dashboard counts |
| GET | `/api/admin/health` | Admin | Check admin route authorization |
| GET | `/api/admin/appointments` | Admin | Admin appointment-list alias |

Doctor and service list endpoints accept `search`, `page`, `limit`, `sort`, and `order`; each also supports its relevant filters. Appointment statuses are `pending`, `confirmed`, `rejected`, `cancelled`, and `completed`.

## Database collections

| Collection | Purpose and relationships |
|---|---|
| `users` | Patient and admin accounts; email is unique. Password hashes are excluded from normal queries and JSON output. |
| `doctors` | Doctor profile, specialization, fee, active state, and references to offered Services. |
| `services` | Service name, description, fee, duration, and active state. |
| `schedules` | A date-specific doctor schedule, clinic-local working hours and breaks, generated UTC slots, and optional Appointment references. Unique `{ doctorId, date }` index. |
| `appointments` | Patient, Doctor, Service, and Schedule references; clinic-date key, embedded UTC time interval, status, and optional reason. Includes ownership/search indexes and an active-slot partial unique index. |

Schedule dates use the `YYYY-MM-DD` clinic calendar date. Working hours and breaks use local `HH:mm` values in `CLINIC_TIME_ZONE`. Each generated slot and appointment interval is stored as a UTC `Date`.

The application uses a MongoDB transaction when the connected topology supports it. Otherwise it conditionally claims the embedded Schedule slot atomically and compensates if saving the Appointment fails. At startup, the backend checks for duplicate active appointments and explicitly creates and verifies the required Schedule and Appointment indexes; it does not call `syncIndexes()`.

## Testing and manual verification

Run the existing focused tests and production build:

```powershell
npm test --prefix backend
npm run build --prefix frontend
```

For manual API tests, use Thunder Client (not Postman):

1. Create a collection environment with `BASE_URL=http://localhost:5000` and `AUTH_TOKEN` set after login.
2. Verify `GET {{BASE_URL}}/api/health` returns `200`.
3. Test patient registration (`201`), duplicate registration (`409`), valid login (`200`), and invalid credentials (`401`).
4. Call `GET {{BASE_URL}}/api/auth/me` without a token (`401`), with an invalid token (`401`), and with the login token (`200`).
5. Login as admin and create a service, doctor, and future schedule. Verify a patient receives `403` on admin-only writes and `GET {{BASE_URL}}/api/admin/dashboard`.
6. As a patient, request a schedule, book a returned slot (`201`), then submit the same slot again (`409`). Confirm the records and indexes in MongoDB Compass.
7. Verify a different patient cannot read/cancel the appointment, cancellation/rejection releases the slot, and only admin can update status.

These are instructions, not a claim that the manual Thunder Client or Compass checks have been run. See `PROGRESS.md` for the checks executed in this workspace and remaining manual verification.
