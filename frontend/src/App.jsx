import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AdminDoctors from './pages/AdminDoctors.jsx';
import AdminAppointments from './pages/AdminAppointments.jsx';
import AdminSchedules from './pages/AdminSchedules.jsx';
import AdminServices from './pages/AdminServices.jsx';
import DoctorDetails from './pages/DoctorDetails.jsx';
import Doctors from './pages/Doctors.jsx';
import Login from './pages/Login.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import Register from './pages/Register.jsx';
import Services from './pages/Services.jsx';
import { getHealthStatus } from './services/api.js';
import './App.css';

function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">MediSlot</Link>
      <nav className="site-navigation" aria-label="Main navigation">
        <Link to="/">Home</Link>
        <Link to="/doctors">Doctors</Link>
        <Link to="/services">Services</Link>
        {!isLoading && user ? (
          <>
            {user.role === 'patient' ? (
              <Link to="/appointments">My appointments</Link>
            ) : (
              <>
                <Link to="/account">My account</Link>
                <Link to="/admin/doctors">Manage doctors</Link>
                <Link to="/admin/services">Manage services</Link>
                <Link to="/admin/schedules">Schedules</Link>
                <Link to="/admin/appointments">Appointments</Link>
              </>
            )}
            <button className="text-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link className="navigation-register" to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function HomePage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBackend() {
      try {
        const status = await getHealthStatus();
        setHealth(status);
      } catch (requestError) {
        const message = requestError.response?.data?.message
          || requestError.message
          || 'Could not reach the backend.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="page home-page">
      <section className="status-card" aria-labelledby="page-title">
        <p className="eyebrow">MERN appointment booking system</p>
        <h1 id="page-title">Welcome to MediSlot</h1>
        <p className="intro">
          Your project setup is ready for the next steps in building a
          simpler way to manage doctor appointments.
        </p>

        <div className="connection-panel" aria-live="polite">
          <h2>System connection</h2>
          {isLoading && <p>Checking the backend connection...</p>}
          {!isLoading && error && (
            <p className="status status-error">
              <span>Backend: unavailable</span>
              <span>{error}</span>
            </p>
          )}
          {!isLoading && health && (
            <>
              <p className="status">
                <span>Backend API</span>
                <strong>{health.backend.status}</strong>
              </p>
              <p className="status">
                <span>MongoDB</span>
                <strong className={health.database.status === 'connected' ? '' : 'status-warning'}>
                  {health.database.status}
                </strong>
              </p>
              <p className="status-message">{health.message}</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <main className="page auth-page">
      <section className="auth-card" aria-labelledby="account-title">
        <p className="eyebrow">Authentication check</p>
        <h1 id="account-title">You are signed in</h1>
        <p className="account-summary">
          Signed in as <strong>{user.name}</strong> ({user.role}).
        </p>
        <button className="primary-button" type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}

function App() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin/doctors"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDoctors />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/services"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminServices />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/schedules"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSchedules />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/appointments"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAppointments />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/appointments"
          element={(
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/account"
          element={(
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
