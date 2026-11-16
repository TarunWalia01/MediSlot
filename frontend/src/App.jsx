import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
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
        {!isLoading && user ? (
          <>
            <Link to="/account">My account</Link>
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
