import { useEffect, useState } from 'react';
import {
  getDoctors,
  getAdminAppointments,
  updateAppointmentStatus
} from '../services/api.js';
import { formatClinicTime } from '../services/dateTime.js';

const transitionOptions = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  rejected: [],
  cancelled: [],
  completed: []
};

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterForm, setFilterForm] = useState({
    status: '',
    date: '',
    doctorId: '',
    patientId: ''
  });
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadAppointments() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const [doctorResult, appointmentResult] = await Promise.all([
          getDoctors({ page: 1, limit: 100, sort: 'name', order: 'asc' }),
          getAdminAppointments({ page, limit: 20, ...filters })
        ]);
        if (isCurrent) {
          setDoctors(doctorResult.data);
          setAppointments(appointmentResult.data);
          setPagination(appointmentResult.pagination);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load appointment requests.'
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
  }, [page, filters, refreshKey]);

  function applyFilters(event) {
    event.preventDefault();
    const appliedFilters = Object.fromEntries(
      Object.entries(filterForm)
        .map(([field, value]) => [field, value.trim()])
        .filter(([, value]) => value)
    );
    setPage(1);
    setFilters(appliedFilters);
  }

  async function handleStatusChange(appointment, status) {
    setUpdatingId(appointment._id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateAppointmentStatus(appointment._id, status);
      setSuccessMessage(`Appointment ${status}.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to update this appointment.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Administrator</p>
        <h1>Appointment management</h1>
        <p>Review patient requests and apply permitted appointment status changes.</p>
      </section>

      <form className="filter-panel appointment-filter admin-appointment-filter" onSubmit={applyFilters}>
        <label className="filter-field">
          <span>Status</span>
          <select
            value={filterForm.status}
            onChange={(event) => setFilterForm((current) => ({
              ...current,
              status: event.target.value
            }))}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Date</span>
          <input
            type="date"
            value={filterForm.date}
            onChange={(event) => setFilterForm((current) => ({
              ...current,
              date: event.target.value
            }))}
          />
        </label>
        <label className="filter-field">
          <span>Doctor</span>
          <select
            value={filterForm.doctorId}
            onChange={(event) => setFilterForm((current) => ({
              ...current,
              doctorId: event.target.value
            }))}
          >
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Patient ID</span>
          <input
            value={filterForm.patientId}
            maxLength="24"
            placeholder="MongoDB patient ID"
            onChange={(event) => setFilterForm((current) => ({
              ...current,
              patientId: event.target.value
            }))}
          />
        </label>
        <button className="primary-button filter-submit" type="submit">Apply filters</button>
      </form>

      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="form-success" role="status">{successMessage}</p>}
      {isLoading && <p className="page-state" role="status">Loading appointments...</p>}
      {!isLoading && !errorMessage && appointments.length === 0 && (
        <p className="page-state">No appointments match this view.</p>
      )}
      {!isLoading && appointments.length > 0 && (
        <div className="appointment-list">
          {appointments.map((appointment) => {
            const actions = transitionOptions[appointment.status] || [];
            return (
              <article className="appointment-card" key={appointment._id}>
                <div className="appointment-card-heading">
                  <div>
                    <p className="card-eyebrow">{appointment.appointmentDate}</p>
                    <h2>{appointment.doctorId?.name || 'Doctor details unavailable'}</h2>
                    <p>{appointment.doctorId?.specialization || ''}</p>
                  </div>
                  <span className={`appointment-status status-${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
                <dl className="appointment-facts">
                  <div>
                    <dt>Patient</dt>
                    <dd>
                      {appointment.patientId?.name || 'Patient details unavailable'}
                      {appointment.patientId?.email ? ` · ${appointment.patientId.email}` : ''}
                    </dd>
                  </div>
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
                    <dd>{appointment.serviceId?.name || 'Service details unavailable'}</dd>
                  </div>
                </dl>
                {appointment.reason && (
                  <p className="appointment-reason"><strong>Reason:</strong> {appointment.reason}</p>
                )}
                {actions.length > 0 && (
                  <div className="management-actions">
                    {actions.map((status) => (
                      <button
                        className={status === 'rejected' || status === 'cancelled'
                          ? 'danger-button'
                          : 'secondary-button'}
                        type="button"
                        key={status}
                        disabled={updatingId === appointment._id}
                        onClick={() => handleStatusChange(appointment, status)}
                      >
                        {updatingId === appointment._id ? 'Saving...' : statusLabel(status)}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {pagination && pagination.totalPages > 1 && (
        <nav className="pagination" aria-label="Appointment pages">
          <button
            className="secondary-button"
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            className="secondary-button"
            type="button"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default AdminAppointments;
