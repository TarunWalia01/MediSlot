import { useEffect, useState } from 'react';
import { getHealthStatus } from './services/api.js';
import './App.css';

function App() {
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
    <main className="page">
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

export default App;
