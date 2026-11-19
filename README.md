# MediSlot — Online Doctor Appointment Booking System

## About the Project

MediSlot is a college project developed to make it easier for patients to find doctors and book appointments online. It brings doctor and service information, available schedules, and appointment management together in one place instead of relying on separate calls or in-person visits.

## Team Members

1. Tarun Walia — 2400290100318
2. Sundaram Yadav — 2400290100313
3. Yuvraj Singh — 2400290100364
4. Gaurav Sinha — 2400290100144

## Features

- Patient registration and login.
- Patient and admin roles, with admin-only management pages and API operations.
- Doctor listing, search, profiles, and service information.
- Medical services management.
- Doctor schedule and appointment availability management.
- Appointment booking, patient cancellation, and appointment status updates.
- Patient appointment dashboard and admin dashboard with summary counts.

## Technology Stack

**Frontend**

- React.js
- JavaScript
- CSS
- Axios

**Backend**

- Node.js
- Express.js
- JavaScript
- JWT
- bcryptjs for password hashing

**Database**

- MongoDB Atlas
- Mongoose

## Project Structure

```text
MediSlot/
├── backend/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # API request handling
│   ├── middleware/     # Authentication and role checks
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Admin setup script
│   ├── tests/           # Backend tests
│   ├── utils/           # Shared backend helpers
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

## Database Collections

- **Users** — patient and admin accounts.
- **Doctors** — doctor profiles and the services they provide.
- **Services** — medical services, fees, and appointment durations.
- **Schedules** — doctor schedules and their appointment slots.
- **Appointments** — booked visits, related patient, doctor and service records, and appointment status.

## Installation and Setup

### 1. Clone the repository

```powershell
git clone https://github.com/TarunWalia01/MediSlot.git
cd MediSlot
```

### 2. Install backend dependencies

Run this from the project root:

```powershell
npm install --prefix backend
```

### 3. Install frontend dependencies

```powershell
npm install --prefix frontend
```

### 4. Configure environment variables

Copy the example files:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

In `backend/.env`, set `MONGODB_URI` to your MongoDB Atlas connection string and replace `JWT_SECRET` with a private random value. The file also provides `PORT`, `CORS_ORIGIN`, `JWT_EXPIRES_IN`, and `CLINIC_TIME_ZONE`. Set the `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, and `ADMIN_PASSWORD` values only if you are creating the first admin account.

The frontend example includes `VITE_API_BASE_URL` and `VITE_CLINIC_TIME_ZONE`. The default API address is `http://localhost:5000/api`.

Do not commit either `.env` file or put database credentials or JWT secrets in frontend variables.

To create the first admin account, fill in the `ADMIN_*` values and run this from the project root:

```powershell
npm run seed:admin --prefix backend
```

### 5. Start the backend

Open a terminal at the project root and run:

```powershell
npm run dev --prefix backend
```

### 6. Start the frontend

Open a second terminal at the project root and run:

```powershell
npm run dev --prefix frontend
```

### 7. Open the application

Visit [http://localhost:5173](http://localhost:5173) in your browser. The backend API runs at `http://localhost:5000`.

## Running the Project

Development backend:

```powershell
npm run dev --prefix backend
```

Frontend:

```powershell
npm run dev --prefix frontend
```

To start the backend without watch mode:

```powershell
npm start --prefix backend
```

## API Overview

The API is served under `/api`:

- **Authentication** — `/api/auth` for patient registration, login, and the current account.
- **Doctors** — `/api/doctors` for doctor profiles and admin management.
- **Services** — `/api/services` for services and admin management.
- **Schedules** — `/api/schedules` for doctor availability and admin schedule management.
- **Appointments** — `/api/appointments` for booking, patient history, cancellation, and status updates.
- **Admin** — `/api/admin` for dashboard statistics and admin appointment access.

## Project Purpose

We developed MediSlot as part of our B.Tech academic coursework to apply concepts in backend development, database management, and API development.
