# MediSlot --- Master Development Prompt

## MERN Online Doctor Appointment Booking System

> **Project level:** B.Tech 3rd-year academic project\
> **Team:** 4+ members\
> **Development approach:** Hybrid --- AI-assisted coding with human
> understanding, review and testing\
> **Target:** Complete working MERN application with a clean,
> responsive, basic-professional UI\
> **API testing:** Thunder Client (already installed in VS Code)\
> **Backend development server:** Node.js built-in `--watch` mode (do
> not use Nodemon)

------------------------------------------------------------------------

## 1. Your role and how to work with us

Act as a senior MERN-stack developer, software architect, MongoDB
database designer, QA engineer and patient technical mentor.

We are B.Tech 3rd-year students. We have learned some backend concepts
and want to build this project while understanding the code. AI may
generate and explain code, but we must be able to read, modify, debug,
test and explain the application during our project demonstration and
viva.

Build the application incrementally, module by module. Do not generate
the entire project in one uncontrolled response. Do not claim something
works unless it has actually been tested or clearly label it as
untested.

For every phase: 1. Briefly explain the goal and design decisions. 2.
Inspect the existing workspace and files before changing anything. 3.
State which files will be created or modified. 4. Implement the smallest
coherent set of changes. 5. Explain important code, API flow and
database interactions in student-friendly language. 6. Give exact
commands to run and verify the work. 7. Test where your environment
permits. If you cannot run a test, give us exact Thunder Client steps
and clearly say that we must run them. 8. Fix errors before moving on.
9. Summarize completed work and remaining tasks.

Do not proceed to the next phase without our confirmation.

## 2. Project overview

**Project name:** MediSlot\
**Project type:** MERN-stack online doctor appointment booking system

MediSlot allows patients to: - Register and log in. - Search for doctors
by name or specialization. - Browse medical services. - View doctor
profiles and availability. - View available appointment dates and time
slots. - Book appointments. - Cancel eligible appointments. - Track
appointment status. - View appointment history and manage their profile.

Administrators can: - Manage doctors. - Manage medical services. -
Manage doctor schedules and time slots. - View and manage
appointments. - Confirm, reject, cancel or complete appointments. - View
and manage registered patient accounts.

The result must be a real full-stack application connected to MongoDB,
not merely a static UI or a collection of mock screens.

## 3. Technology stack --- use this consistently

### Frontend

-   React.js
-   Vite
-   JavaScript
-   Regular CSS
-   React Router DOM
-   Axios for API requests

### Backend

-   Node.js
-   Express.js
-   JavaScript
-   REST APIs
-   Mongoose ODM

### Database

-   MongoDB Atlas
-   MongoDB Compass

### Authentication and security

-   JWT
-   bcrypt
-   Express authentication and role middleware
-   Environment variables

### Development, testing and collaboration

-   VS Code
-   **Thunder Client for all REST API testing**
-   **Node.js built-in watch mode for backend auto-restart**
-   MongoDB Compass for database inspection
-   Git and GitHub

Do not use Postman. Do not install or use Nodemon. Do not add
unnecessary frameworks or dependencies. Use regular CSS initially rather
than introducing Tailwind or another styling system without asking us.

## 4. UI and visual design requirements

Create a clean, modern, professional healthcare booking website.

The visual direction should follow the supplied MediSlot reference/demo
images as closely as possible: - White and light-blue healthcare
palette. - Clear typography and readable text. - Good spacing, alignment
and visual hierarchy. - Rounded cards and buttons. - Subtle shadows and
restrained transitions. - Consistent navbar, footer, buttons, forms and
cards. - Professional dashboards. - Responsive layouts for desktop,
tablet and mobile. - Professional icons where appropriate.

The reference images are excellent visual inspiration. If they are
available in the workspace or conversation, inspect and use them as
design references. If they are not accessible, reproduce the same
general quality and direction using your own design judgement; do not
claim to have inspected unavailable images.

Avoid: - Excessive gradients or bright colours. - Unnecessary
animations. - Cartoon-like illustrations. - Cluttered dashboards. - Too
many emojis. - Decorative elements that reduce readability.

Use very few emojis in the application and in explanations. Prefer text
labels and professional icons.

### Required pages

#### A. Landing page

-   Navbar with MediSlot branding.
-   Home, Doctors, Services, Login and Register navigation.
-   Hero section explaining appointment booking.
-   Doctor search by name or specialization.
-   Popular specializations.
-   Featured doctors loaded from the API.
-   Medical services section.
-   "How it works" section.
-   Footer with useful links and contact information.

#### B. Registration

-   Full name, email, phone, password and confirm password.
-   Client-side validation and clear error messages.
-   Password visibility toggle.
-   Link to login.
-   Public registration must always create a patient account. Never let
    users choose or self-assign the admin role.

#### C. Login

-   Email and password.
-   Validation and clear error messages.
-   Password visibility toggle.
-   Redirect patients to the patient dashboard and admins to the admin
    dashboard.
-   Implement logout.

#### D. Doctor listing

Doctor cards should show: - Profile image. - Name and specialization. -
Qualifications and experience. - Consultation fee. - Availability
summary. - View Profile and Book Appointment actions.

Provide: - Search by name. - Filter by specialization. - Filter by fee
where practical. - Sorting by fee or experience. - Pagination.

All doctor data must come from the backend, not hardcoded arrays.

#### E. Doctor details

Show the doctor's profile, qualifications, experience, specialization,
fee, description, services and availability. Allow a logged-in patient
to select a date and an available slot.

#### F. Patient dashboard

Show: - Welcome message and profile information. - Appointment summary
counts. - Upcoming appointments. - Pending, confirmed, completed and
cancelled appointments. - Appointment history and details.

Patients can view their own appointments, cancel eligible appointments
and update their profile. A patient must never be able to access another
patient's records by changing an ID in a URL or API request.

#### G. Admin dashboard

Create a separate, protected admin layout with sidebar navigation.

Dashboard statistics: - Total doctors. - Total registered patients. -
Total appointments. - Pending, confirmed and completed appointments.

Admin modules:

**Doctor management** - Add, view, edit, deactivate or delete doctors as
appropriate.

**Service management** - Add, view, edit, deactivate or delete
services. - Manage fees and appointment duration.

**Schedule management** - Create and update doctor schedules. -
Configure available days and slots. - View available and booked slots.

**Appointment management** - View all appointments. - Filter by date,
doctor, patient and status. - Confirm, reject or cancel appointments. -
Mark eligible appointments as completed.

**Patient management** - View patients and their details. - Deactivate
accounts where appropriate.

Admin APIs must be protected on the backend. Hiding a button or page in
React is not security.

## 5. Roles and appointment workflow

There are two roles: `patient` and `admin`.

### Patient workflow

1.  Register or log in.
2.  Search for a doctor or service.
3.  Open a doctor profile.
4.  Select a date.
5.  View available slots.
6.  Select a slot and submit a booking.
7.  Backend validates the slot and creates a pending appointment.
8.  Patient can view the booking and its status.
9.  Patient can cancel when cancellation rules permit.

### Admin workflow

1.  Log in.
2.  Open the admin dashboard.
3.  Review pending requests.
4.  Confirm or reject an appointment.
5.  Manage doctors, services and schedules.
6.  Mark appointments completed when appropriate.

Use these appointment statuses: - `pending` - `confirmed` - `rejected` -
`cancelled` - `completed`

Validate allowed status transitions on the backend. Do not allow
arbitrary status changes from patients.

## 6. MongoDB database architecture

Use Mongoose and create these five primary collections. You may add
supporting collections only when there is a clear reason and explain it
first.

### 1. Users

Suggested fields: - `name` - `email` - `password` - `phone` - `role`
(`patient` or `admin`) - `isActive` - timestamps

Requirements: - Hash passwords with bcrypt. - Never return password
hashes in API responses. - Email should be unique and normalized. -
Public registration always assigns `patient`. - Create the first admin
using a controlled seed script or secure manual setup, never public
admin registration.

### 2. Doctors

Suggested fields: - `name` - `email` - `phone` - `specialization` -
`qualification` - `experience` - `consultationFee` - `description` -
`profileImage` - `services` (references to Services) - `availableDays` -
`isActive` - timestamps

### 3. Services

Suggested fields: - `name` - `description` - `fee` - `duration` -
`isActive` - timestamps

Example services: General Consultation, Cardiology, Dermatology, Dental
Care, Orthopedics and Neurology.

### 4. Schedules

Suggested fields: - `doctorId` - `date` - `slots` (embedded
subdocuments)

Each slot should include: - `startTime` - `endTime` - `isBooked` or a
clearly justified equivalent - `appointmentId` (optional reference)

Choose and document a consistent date/time representation. Avoid fragile
comparisons of formatted time strings. Store actual date/time values or
a consistent date plus normalized slot start/end values, and handle the
clinic's timezone explicitly.

### 5. Appointments

Suggested fields: - `patientId` - `doctorId` - `serviceId` -
`appointmentDate` - `timeSlot` (embedded object with start and end) -
`status` - optional `reason` - timestamps

### Database design rules

-   Use ObjectId references for relationships between collections.
-   Use embedded documents for suitable nested data such as schedule
    slots and appointment time details.
-   Use Mongoose validation and sensible indexes.
-   Use `.populate()` where it is useful.
-   Explain why each relationship is embedded or referenced.
-   Handle missing, invalid and inactive references.
-   Prevent duplicate records where appropriate.
-   Do not put every entity into one large document.
-   Keep the schema understandable for a third-year student.

## 7. Critical appointment correctness and concurrency

Double-booking prevention is a core requirement.

Example: two patients try to book the same doctor's slot at the same
time. Only one request may succeed.

Do not rely on frontend availability checks. The backend/database must
enforce booking correctness.

Before implementing booking, explain the chosen data model and
concurrency strategy. Use an appropriate combination of: - Atomic
conditional updates. - Unique compound indexes where the data model
supports them. - MongoDB transactions when required and supported by the
deployment topology. - Validation of doctor, schedule, date and slot. -
Consistent rollback/cleanup if a multi-document operation fails.

Do not assume transactions work on every local MongoDB setup; verify the
Atlas deployment supports the required transaction behaviour.

Rules: - Reject past appointment dates and past slots. - Reject
unavailable or already-booked slots. - Prevent duplicate active bookings
for the same doctor/date/slot. - Cancellation and rejection must release
the slot consistently. - Confirmed appointments continue to occupy the
slot. - Completed appointments remain in history. - A patient may cancel
only their own eligible appointment. - Only an authorized admin may
confirm, reject or mark an appointment completed. - Avoid race
conditions when two requests arrive concurrently.

Do not mark a slot as booked in one collection and create an appointment
in another without a reliable consistency strategy.

## 8. Backend architecture and API endpoints

Use modular Express architecture. Keep routes, controllers, models and
middleware separate. Do not put all logic into `server.js`.

### Authentication

-   `POST /api/auth/register`
-   `POST /api/auth/login`
-   `GET /api/auth/me`

### Doctors

-   `GET /api/doctors`
-   `GET /api/doctors/:id`
-   `POST /api/doctors`
-   `PUT /api/doctors/:id`
-   `DELETE /api/doctors/:id`

### Services

-   `GET /api/services`
-   `GET /api/services/:id`
-   `POST /api/services`
-   `PUT /api/services/:id`
-   `DELETE /api/services/:id`

### Schedules

-   `GET /api/schedules/:doctorId`
-   `POST /api/schedules`
-   `PUT /api/schedules/:id`
-   `DELETE /api/schedules/:id`

### Appointments

-   `POST /api/appointments`
-   `GET /api/appointments/my`
-   `GET /api/appointments/:id`
-   `PATCH /api/appointments/:id/cancel`
-   `PATCH /api/appointments/:id/status`

### Admin

-   `GET /api/admin/dashboard`
-   `GET /api/admin/appointments`
-   `GET /api/admin/patients`

Add supporting endpoints only when required by the UI and explain why.

### API requirements

-   Correct HTTP methods and status codes.
-   Consistent JSON response structure.
-   Request validation and useful error messages.
-   Authentication and role authorization.
-   Search, filtering, sorting and pagination.
-   Do not expose stack traces or secrets in production responses.

Examples: -
`GET /api/doctors?page=1&limit=10&specialization=Cardiology` -
`GET /api/doctors?search=Amit` - `GET /api/doctors?sort=consultationFee`

Implement actual filtering, sorting and pagination; do not merely accept
query parameters.

## 9. Security requirements

Implement: 1. bcrypt password hashing. 2. JWT creation and verification.
3. Authentication middleware. 4. Role-based authorization middleware. 5.
Protected patient and admin APIs. 6. Ownership checks for patient
records. 7. Input validation and sanitization appropriate to the
application. 8. Safe error handling. 9. Environment variable management.
10. Secure handling of credentials and tokens.

Never: - Store plain-text passwords. - Expose MongoDB credentials or JWT
secrets. - Trust a role supplied by the frontend. - Allow patients to
access or modify other patients' appointments. - Allow public admin
registration.

Choose a sensible token strategy and explain it. If using cookies,
configure HttpOnly, Secure and SameSite correctly. If using
authorization headers, document token storage and its risks. Do not
store sensitive secrets in frontend environment variables.

## 10. Exact main folder structure

Maintain this structure. You may add small supporting files when needed,
but do not randomly rename or flatten the main folders.

``` text
MediSlot/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── DoctorCard.jsx
│       │   └── ProtectedRoute.jsx
│       │
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Doctors.jsx
│       │   ├── DoctorDetails.jsx
│       │   ├── PatientDashboard.jsx
│       │   └── AdminDashboard.jsx
│       │
│       ├── services/
│       ├── context/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│   │
│   ├── .env
│   └── package.json
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Service.js
│   │   ├── Schedule.js
│   │   └── Appointment.js
│   │
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── .gitignore
```

Add supporting files where necessary, for example validation utilities,
error middleware, seed scripts, API service files, context providers,
reusable form components and tests. Explain their purpose and keep the
main organization intact.

## 11. Six development phases

Build these phases in order. Stop after each phase and wait for our
explicit confirmation.

### Phase 1 --- Project setup and database connection

1.  Inspect the workspace.
2.  Create the root `MediSlot` structure.
3.  Initialize React with Vite in `frontend`.
4.  Initialize Express in `backend`.
5.  Install required dependencies.
6.  Configure MongoDB Atlas connection.
7.  Create `backend/config/db.js`.
8.  Create `backend/server.js`.
9.  Configure `.env` files and `.gitignore`.
10. Configure CORS and JSON parsing.
11. Create `GET /api/health`.
12. Connect React to the health endpoint.
13. Initialize Git and explain GitHub setup.

Backend dependencies:

``` bash
npm install express mongoose dotenv cors
```

Development scripts must be:

``` json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js"
}
```

Do not install Nodemon. Use `npm run dev` during development and
`npm start` for normal startup.

Frontend dependencies:

``` bash
npm install react-router-dom axios
```

Expected result: - React at `http://localhost:5173`. - Express at
`http://localhost:5000`. - MongoDB Atlas connected. - `GET /api/health`
reports backend and database status. - React successfully fetches and
displays the health status.

Do not proceed until this is verified.

### Phase 2 --- Database models and authentication

1.  Create the five Mongoose models.
2.  Add schema validation and indexes.
3.  Implement registration and login.
4.  Hash passwords using bcrypt.
5.  Implement JWT generation and verification.
6.  Implement authentication middleware.
7.  Implement role middleware.
8.  Implement `GET /api/auth/me`.
9.  Create a secure admin seed/setup method.
10. Connect React registration and login.
11. Implement logout and protected routes.
12. Test all relevant cases with Thunder Client.

Expected result: patient and admin authentication works, and each role
can access only authorized routes.

### Phase 3 --- Doctor and service management

1.  Implement doctor CRUD APIs.
2.  Implement service CRUD APIs.
3.  Implement search and filters.
4.  Implement sorting and pagination.
5.  Build doctor listing and details pages.
6.  Build admin doctor and service management screens.
7.  Test APIs and inspect MongoDB records.

Expected result: admin manages doctors/services and patients can search
and browse real database records.

### Phase 4 --- Schedules and appointment management

1.  Implement schedule APIs.
2.  Create and update doctor schedules.
3.  Generate and retrieve available slots.
4.  Implement appointment booking.
5.  Implement reliable double-booking prevention.
6.  Implement cancellation and slot release.
7.  Implement status transitions.
8.  Implement patient appointment history.
9.  Implement admin appointment management.
10. Test concurrent and invalid booking cases.

Expected result: the appointment workflow works correctly with persisted
MongoDB data.

### Phase 5 --- Frontend integration and dashboards

1.  Complete the landing page.
2.  Complete registration and login.
3.  Complete doctor listing and details.
4.  Complete booking UI.
5.  Complete patient dashboard.
6.  Complete admin dashboard.
7.  Connect all pages to backend APIs.
8.  Add loading, empty, success and error states.
9.  Make layouts responsive.
10. Test complete patient and admin workflows.

Expected result: a complete, consistent and functional user-facing
application. No major button should be decorative or nonfunctional.

### Phase 6 --- Testing, deployment and documentation

1.  Test every API using Thunder Client.
2.  Verify records and relationships using MongoDB Compass.
3.  Test patient/admin permissions.
4.  Test booking edge cases and concurrent booking attempts.
5.  Test form validation and error states.
6.  Fix bugs.
7.  Deploy frontend and backend using suitable services.
8.  Document environment setup.
9.  Prepare README and API documentation.
10. Prepare project report, presentation and viva notes.

Expected result: a tested, deployable and presentable academic project.

## 12. University syllabus mapping

The project should help demonstrate the following syllabus concepts.
Implement them naturally where relevant and provide small separate
examples/documentation for theoretical concepts that do not belong in
the production application.

### Unit 3 --- Introduction to Database and NoSQL

-   SQL vs NoSQL.
-   Advantages and limitations of NoSQL.
-   Types of NoSQL databases.
-   Document databases.
-   Key-value database model (a separate illustrative example if
    needed).
-   Database design.
-   Embedded versus referenced data.
-   Database properties.
-   Sharding concepts (explain with an example; do not add unnecessary
    distributed infrastructure to MediSlot).

### Unit 4 --- Introduction to MongoDB

-   MongoDB setup and Atlas.
-   MongoDB Compass.
-   Mongoose connection.
-   CRUD operations.
-   Basic MongoDB commands.
-   Migration from simple in-memory data to MongoDB, demonstrated
    through a small example or seed/migration script.

### Unit 5 --- Read and query operations

Demonstrate meaningful examples of: - Nested documents. - Arrays. -
Sorting. - Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`,
`$lte`, `$in`, `$nin`. - Logical operators: `$and`, `$or`. -
Nested-field queries. - Array queries. - `$elemMatch`. - Multiple
conditions. - Projection. - Filtering and pagination. - JWT
authentication. - Express route protection middleware.

Use these concepts in actual MediSlot features where sensible. For
theoretical syllabus items, provide a separate concise example and
explain it.

## 13. Code quality and explanation style

Write natural, human-readable code suitable for a competent third-year
B.Tech student.

-   Use meaningful variable and function names.
-   Keep functions focused and reasonably small.
-   Prefer straightforward JavaScript and async/await.
-   Avoid unnecessary one-liners and clever tricks.
-   Avoid excessive abstraction and enterprise-level complexity.
-   Keep routes, controllers, models and middleware separate.
-   Use comments where they genuinely clarify logic.
-   Maintain consistent naming and formatting.
-   Do not add unnecessary dependencies.
-   Do not sacrifice security or correctness for simplicity.

Explain important code in plain, student-friendly language. Avoid overly
formal or robotic explanations. Use very few emojis.

Do not dump huge amounts of code without explaining file placement and
purpose. At the same time, keep explanations concise for simple changes.

## 14. Thunder Client API testing workflow

Thunder Client is already installed in our VS Code. **Use Thunder
Client, not Postman.**

Create and maintain Thunder Client collections for: - Authentication -
Doctors - Services - Schedules - Appointments - Admin

Use Thunder Client environment variables such as: - `BASE_URL` =
`http://localhost:5000` - `AUTH_TOKEN` = token obtained from login

For every endpoint, document: - HTTP method. - Full URL. - Headers. -
Request body. - Expected status code. - Expected JSON response. -
Relevant error responses. - Whether patient/admin authentication is
required.

Test successful requests, invalid input, missing authentication,
insufficient role, missing records, duplicate records and other relevant
edge cases.

After testing, inspect actual database changes in MongoDB Compass.

If you cannot operate Thunder Client directly, provide exact steps for
us to run manually. Do not claim that an API has been tested when it has
not.

## 15. Error handling and verification

Never assume generated code works.

After every module: 1. Check imports and package dependencies. 2. Check
paths and filenames. 3. Check route registration and endpoint URLs. 4.
Check request and response shapes. 5. Check schema validation and
database queries. 6. Check authentication and authorization. 7. Check
error and edge-case behaviour. 8. Run available tests. 9. Provide
Thunder Client verification steps for manual testing. 10. Fix discovered
issues before continuing.

Use consistent error responses and appropriate HTTP status codes. Do not
return fake success responses. Do not use hardcoded demo arrays as a
substitute for backend functionality. Demo records are acceptable when
inserted into MongoDB through a seed script.

## 16. Git and team collaboration

We have a team of 4+ members. Suggested responsibility split:

-   Member 1: authentication, users, JWT and security middleware.
-   Member 2: doctors, services, schedules, appointments and backend
    APIs.
-   Member 3: landing page, authentication UI, doctor listing and doctor
    profile.
-   Member 4: patient dashboard, admin dashboard, API integration and
    frontend testing.
-   Additional members: database documentation, Thunder Client testing,
    QA, report and presentation.

Suggested branches: - `main` - `backend-auth` - `backend-doctors` -
`backend-appointments` - `frontend-ui` - `frontend-dashboard`

Coordinate shared-file changes. Keep `main` stable and merge tested work
through pull requests. Never commit `.env` files or credentials.

## 17. Final acceptance checklist

Before calling the project complete, verify:

### Functionality

-   Patient registration and login.
-   Admin login.
-   Doctor search and filters.
-   Doctor CRUD.
-   Service CRUD.
-   Schedule management.
-   Appointment booking and cancellation.
-   Appointment status tracking.
-   Admin appointment management.
-   Patient appointment history.
-   Double-booking prevention.

### Database

-   MongoDB connection works.
-   Five primary collections exist.
-   References and embedded documents work.
-   CRUD operations persist data.
-   Queries, sorting and pagination work.
-   Indexes and validation are appropriate.

### Frontend

-   All required pages exist.
-   Navigation works.
-   Forms validate inputs.
-   Dashboards use real API data.
-   Loading, empty, success and error states exist.
-   Layout is responsive and consistent.
-   Major controls perform real actions.

### Security

-   Passwords are hashed.
-   JWT verification works.
-   Role-based authorization works.
-   Patient ownership checks work.
-   Secrets are not exposed.
-   Admin creation is controlled.

### Documentation

-   README has setup instructions.
-   Environment variables are documented without real secrets.
-   APIs are documented.
-   Database architecture is explained.
-   Syllabus mapping is included.
-   Project report and viva material can be prepared.

## 18. Start now --- Phase 1 only

First inspect the currently opened workspace.

If it is empty, create the project. If files already exist, inspect and
preserve useful work. Do not overwrite existing files without checking
them.

Then: 1. Present the proposed project structure. 2. Explain Phase 1
briefly. 3. Initialize frontend and backend. 4. Install only the
required dependencies. 5. Configure `.env` and `.gitignore`. 6. Create
MongoDB connection configuration. 7. Create the Express server and
health endpoint. 8. Connect React to the health endpoint. 9. Configure
Git. 10. Verify what you can in the available environment.

If MongoDB Atlas credentials or network configuration are not available,
create the code and tell us exactly what information/action is needed.
Never invent credentials or claim a successful connection.

At the end, report: - Files created. - Dependencies installed. -
Commands to run frontend and backend. - MongoDB connection result or
remaining setup. - Health API test result. - Frontend-to-backend test
result. - Thunder Client steps we need to perform. - Any issues still
unresolved.

**STOP after Phase 1 and wait for our confirmation before starting Phase
2.**

## Final instruction

Our objective is to build a complete, understandable and professionally
presented MediSlot application, not merely to generate code quickly.

Keep the project structure stable, use Thunder Client for API testing,
use Node.js `--watch` instead of Nodemon, write human-readable
student-friendly code, use minimal emojis, explain important decisions
and verify each phase before proceeding.

Start Phase 1 now.

## 19. Usage-aware working protocol

We are using a free AI plan, so help us use the available usage
efficiently. You cannot see our account quota, remaining messages, or
exact reset time, and you must never guess them.

Follow these rules: 1. Work in small, complete milestones rather than
attempting to generate the entire application in one response. 2.
Prioritize the current phase and do not start future phases without our
confirmation. 3. Avoid repeating the full project specification in every
response. Refer to the agreed requirements and summarize only the
relevant context. 4. Before making a large change, explain the scope and
list the files involved. 5. Prefer focused code changes over
regenerating files that are already correct. 6. At the end of each
milestone, provide a concise checkpoint containing: - What was
completed. - Files created or changed. - Commands run. - Tests passed
and tests not yet run. - Known issues. - The exact next task. 7.
Keep the project README accurate and up to date. 8. If the interface
warns that the usage limit has been reached, stop work cleanly. Do not
attempt to bypass the limit, create alternate accounts, or guess when
access will return. 9. If the interface displays a reset time, tell us
to resume at the time shown there. If no reset time is displayed, direct
us to check the account's Usage page. 10. Do not claim that you can
monitor the account's remaining usage or send a reminder when the limit
resets.

The goal is to preserve our project progress and make each available
interaction useful without attempting to evade plan limits.
