import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../services/api.js';

const dashboardLinks = [
  { to: '/admin/doctors', label: 'Manage doctors', description: 'Add, update or deactivate doctor profiles.' },
  { to: '/admin/services', label: 'Manage services', description: 'Maintain the services offered by the clinic.' },
  { to: '/admin/schedules', label: 'Manage schedules', description: 'Set doctor hours and available appointment slots.' },
  { to: '/admin/appointments', label: 'Manage appointments', description: 'Review requests and update appointment status.' }
];

function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadStatistics() {
      try {
        const result = await getAdminDashboard();
        if (isCurrent) {
          setStatistics(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load dashboard statistics.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadStatistics();
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Admin dashboard</h1>
        <p>Review system activity and open a management area.</p>
      </section>

      {isLoading && <p className="page-state" role="status">Loading dashboard...</p>}
      {!isLoading && errorMessage && (
        <p className="page-state error-state" role="alert">{errorMessage}</p>
      )}
      {!isLoading && statistics && (
        <section aria-label="Application statistics">
          <div className="admin-statistics">
            <article className="summary-card"><span>Active doctors</span><strong>{statistics.totalDoctors}</strong></article>
            <article className="summary-card"><span>Patients</span><strong>{statistics.totalPatients}</strong></article>
            <article className="summary-card"><span>Appointments</span><strong>{statistics.totalAppointments}</strong></article>
            <article className="summary-card"><span>Pending</span><strong>{statistics.appointmentsByStatus.pending}</strong></article>
            <article className="summary-card"><span>Confirmed</span><strong>{statistics.appointmentsByStatus.confirmed}</strong></article>
            <article className="summary-card"><span>Completed</span><strong>{statistics.appointmentsByStatus.completed}</strong></article>
          </div>
        </section>
      )}

      <section className="admin-management-links" aria-label="Management areas">
        {dashboardLinks.map((item) => (
          <Link className="admin-management-link" key={item.to} to={item.to}>
            <h2>{item.label}</h2>
            <p>{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default AdminDashboard;
