import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelAppointment,
  getMyAppointments
} from '../services/api.js';
import { formatClinicTime } from '../services/dateTime.js';

function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadAppointments() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await getMyAppointments(
          statusFilter ? { status: statusFilter } : {}
        );
        if (isCurrent) {
          setAppointments(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load your appointments.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();
    return () => {
      isCurrent = false;
    };
  }, [statusFilter, refreshKey]);

  async function handleCancel(appointment) {
    const doctorName = appointment.doctorId?.name || 'this doctor';
    if (!window.confirm(`Cancel your appointment with ${doctorName}?`)) {
      return;
    }

    setCancellingId(appointment._id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await cancelAppointment(appointment._id);
      setSuccessMessage('Appointment cancelled. Its time slot is now available again.');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to cancel this appointment.'
      );
    } finally {
      setCancellingId('');
    }
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Patient account</p>
        <h1>My appointments</h1>
        <p>Review appointment requests and manage eligible upcoming visits.</p>
      </section>

      <section className="filter-panel appointment-filter" aria-label="Filter appointments">
        <label className="filter-field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </section>

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="form-success" role="status">{successMessage}</p>}
      {isLoading && <p className="page-state" role="status">Loading your appointments...</p>}
      {!isLoading && !statusFilter && appointments.length > 0 && (
        <section className="appointment-summary" aria-label="Appointment counts">
          {['pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((status) => (
            <div className="summary-card" key={status}>
              <span>{status}</span>
              <strong>{appointments.filter((appointment) => appointment.status === status).length}</strong>
            </div>
          ))}
        </section>
      )}
      {!isLoading && !errorMessage && appointments.length === 0 && (
        <section className="page-state">
          <p>No appointments match this view.</p>
          <Link className="secondary-button" to="/doctors">Find a doctor</Link>
        </section>
      )}
      {!isLoading && appointments.length > 0 && (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const canCancel = ['pending', 'confirmed'].includes(appointment.status)
              && new Date(appointment.timeSlot.startTime) > new Date();
            const doctor = appointment.doctorId;
            const service = appointment.serviceId;

            return (
              <article className="appointment-card" key={appointment._id}>
                <div className="appointment-card-heading">
                  <div>
                    <p className="card-eyebrow">{appointment.appointmentDate}</p>
                    <h2>{doctor?.name || 'Doctor details unavailable'}</h2>
                    <p>{doctor?.specialization || ''}</p>
                  </div>
                  <span className={`appointment-status status-${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
                <dl className="appointment-facts">
                  <div>
                    <dt>Time</dt>
                    <dd>
                      {formatClinicTime(appointment.timeSlot.startTime)}
                      {' - '}
                      {formatClinicTime(appointment.timeSlot.endTime)}
                    </dd>
                  </div>
                  <div>
                    <dt>Service</dt>
                    <dd>{service?.name || 'Service details unavailable'}</dd>
                  </div>
                  <div>
                    <dt>Fee</dt>
                    <dd>{service ? `₹${Number(service.fee).toLocaleString('en-IN')}` : '—'}</dd>
                  </div>
                </dl>
                {appointment.reason && (
                  <p className="appointment-reason"><strong>Reason:</strong> {appointment.reason}</p>
                )}
                {canCancel && (
                  <button
                    className="danger-button"
                    type="button"
                    disabled={cancellingId === appointment._id}
                    onClick={() => handleCancel(appointment)}
                  >
                    {cancellingId === appointment._id ? 'Cancelling...' : 'Cancel appointment'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default PatientDashboard;
