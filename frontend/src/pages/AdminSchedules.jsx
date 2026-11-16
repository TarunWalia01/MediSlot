import { useEffect, useState } from 'react';
import {
  createSchedule,
  deactivateSchedule,
  getAdminSchedules,
  getDoctors,
  updateSchedule
} from '../services/api.js';
import { getClinicToday } from '../services/dateTime.js';

const blankForm = {
  doctorId: '',
  date: getClinicToday(),
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: '30',
  breaks: []
};

function AdminSchedules() {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadSchedules() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const [doctorResult, scheduleResult] = await Promise.all([
          getDoctors({ page: 1, limit: 100, sort: 'name', order: 'asc' }),
          getAdminSchedules()
        ]);
        if (isCurrent) {
          setDoctors(doctorResult.data);
          setSchedules(scheduleResult.data);
          setForm((currentForm) => ({
            ...currentForm,
            doctorId: currentForm.doctorId || doctorResult.data[0]?._id || ''
          }));
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load schedule management data.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadSchedules();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  function updateFormField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function updateBreak(index, field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      breaks: currentForm.breaks.map((breakPeriod, currentIndex) => (
        currentIndex === index
          ? { ...breakPeriod, [field]: value }
          : breakPeriod
      ))
    }));
  }

  function resetForm() {
    setForm({
      ...blankForm,
      doctorId: doctors[0]?._id || ''
    });
    setEditingId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function beginEdit(schedule) {
    setEditingId(schedule._id);
    setForm({
      doctorId: schedule.doctorId?._id || schedule.doctorId,
      date: schedule.date,
      startTime: schedule.workingHours.startTime,
      endTime: schedule.workingHours.endTime,
      slotDuration: String(schedule.slotDuration),
      breaks: (schedule.breaks || []).map((period) => ({
        startTime: period.startTime,
        endTime: period.endTime
      }))
    });
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const scheduleDetails = {
      doctorId: form.doctorId,
      date: form.date,
      workingHours: {
        startTime: form.startTime,
        endTime: form.endTime
      },
      slotDuration: Number(form.slotDuration),
      breaks: form.breaks
    };

    try {
      if (editingId) {
        await updateSchedule(editingId, scheduleDetails);
        setSuccessMessage('Schedule updated.');
      } else {
        await createSchedule(scheduleDetails);
        setSuccessMessage('Schedule created.');
      }
      setForm({
        ...blankForm,
        doctorId: doctors[0]?._id || ''
      });
      setEditingId('');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to save this schedule.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(schedule) {
    const doctorName = schedule.doctorId?.name || 'this doctor';
    if (!window.confirm(`Deactivate ${doctorName}'s schedule for ${schedule.date}?`)) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deactivateSchedule(schedule._id);
      setSuccessMessage('Schedule deactivated.');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to deactivate this schedule.');
    }
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Administrator</p>
        <h1>Doctor schedules</h1>
        <p>Set date-specific working hours, appointment duration, and break periods.</p>
      </section>

      <section className="management-panel" aria-labelledby="schedule-form-title">
        <h2 id="schedule-form-title">{editingId ? 'Edit schedule' : 'Create a schedule'}</h2>
        <form className="management-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Doctor</span>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={updateFormField}
              required
              disabled={Boolean(editingId)}
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} · {doctor.specialization}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Clinic date</span>
            <input
              name="date"
              type="date"
              min={getClinicToday()}
              value={form.date}
              onChange={updateFormField}
              required
            />
          </label>
          <label className="form-field">
            <span>Working hours start</span>
            <input
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={updateFormField}
              required
            />
          </label>
          <label className="form-field">
            <span>Working hours end</span>
            <input
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={updateFormField}
              required
            />
          </label>
          <label className="form-field">
            <span>Slot duration (minutes)</span>
            <input
              name="slotDuration"
              type="number"
              min="5"
              max="480"
              step="1"
              value={form.slotDuration}
              onChange={updateFormField}
              required
            />
          </label>
          <fieldset className="break-editor full-width-field">
            <legend>Break periods</legend>
            {form.breaks.length === 0 && <p>No breaks added.</p>}
            {form.breaks.map((breakPeriod, index) => (
              <div className="break-row" key={`break-${index}`}>
                <label className="form-field">
                  <span>Break starts</span>
                  <input
                    type="time"
                    value={breakPeriod.startTime}
                    onChange={(event) => updateBreak(index, 'startTime', event.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Break ends</span>
                  <input
                    type="time"
                    value={breakPeriod.endTime}
                    onChange={(event) => updateBreak(index, 'endTime', event.target.value)}
                    required
                  />
                </label>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => setForm((currentForm) => ({
                    ...currentForm,
                    breaks: currentForm.breaks.filter((_, breakIndex) => breakIndex !== index)
                  }))}
                >
                  Remove break
                </button>
              </div>
            ))}
            <button
              className="secondary-button"
              type="button"
              onClick={() => setForm((currentForm) => ({
                ...currentForm,
                breaks: [...currentForm.breaks, { startTime: '', endTime: '' }]
              }))}
            >
              Add break period
            </button>
          </fieldset>
          {errorMessage && <p className="form-error full-width-field" role="alert">{errorMessage}</p>}
          {successMessage && <p className="form-success full-width-field" role="status">{successMessage}</p>}
          <div className="form-actions full-width-field">
            <button className="primary-button" type="submit" disabled={isSaving || doctors.length === 0}>
              {isSaving ? 'Saving...' : (editingId ? 'Save changes' : 'Create schedule')}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
        {!isLoading && doctors.length === 0 && (
          <p className="page-state">Add an active doctor before creating a schedule.</p>
        )}
      </section>

      <section className="management-list" aria-labelledby="schedule-list-title">
        <h2 id="schedule-list-title">Schedules</h2>
        {isLoading && <p className="page-state" role="status">Loading schedules...</p>}
        {!isLoading && !errorMessage && schedules.length === 0 && (
          <p className="page-state">No schedules have been created.</p>
        )}
        {!isLoading && schedules.length > 0 && (
          <div className="management-cards">
            {schedules.map((schedule) => {
              const doctor = schedule.doctorId;
              const bookedCount = schedule.slots.filter((slot) => slot.isBooked).length;
              return (
                <article className="management-card" key={schedule._id}>
                  <div>
                    <h3>{doctor?.name || 'Doctor'} · {schedule.date}</h3>
                    <p>
                      {schedule.dayOfWeek} · {schedule.workingHours.startTime}
                      {' - '}{schedule.workingHours.endTime}
                      {' · '}{schedule.slotDuration} min slots
                    </p>
                    <p>
                      {schedule.slots.length - bookedCount} available · {bookedCount} booked
                      {(schedule.breaks || []).length > 0
                        ? ` · ${schedule.breaks.length} break${schedule.breaks.length > 1 ? 's' : ''}`
                        : ''}
                    </p>
                    <details className="schedule-slot-details">
                      <summary>View generated slots</summary>
                      <ul className="schedule-slot-list">
                        {schedule.slots.map((slot) => (
                          <li key={`${schedule._id}-${slot.startTime}`}>
                            {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                            {' · '}
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </li>
                        ))}
                      </ul>
                    </details>
                    <span className={schedule.isActive ? 'status-pill' : 'status-pill inactive-pill'}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="management-actions">
                    {schedule.isActive && (
                      <>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => beginEdit(schedule)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => handleDeactivate(schedule)}
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function formatSlotTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: import.meta.env.VITE_CLINIC_TIME_ZONE || 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(value));
}

export default AdminSchedules;
