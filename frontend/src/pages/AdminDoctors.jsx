import { useEffect, useState } from 'react';
import {
  createDoctor,
  deactivateDoctor,
  getDoctors,
  getServices,
  updateDoctor
} from '../services/api.js';

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const emptyDoctor = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  qualification: '',
  experience: '',
  consultationFee: '',
  description: '',
  profileImage: '',
  services: [],
  availableDays: [],
  isActive: true
};

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyDoctor);
  const [editingId, setEditingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadManagementData() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const [doctorResult, serviceResult] = await Promise.all([
          getDoctors({
            includeInactive: true,
            page: 1,
            limit: 100,
            sort: 'name',
            order: 'asc'
          }),
          getServices({
            includeInactive: true,
            page: 1,
            limit: 100,
            sort: 'name',
            order: 'asc'
          })
        ]);
        if (isCurrent) {
          setDoctors(doctorResult.data);
          setServices(serviceResult.data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load doctor management data.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadManagementData();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  function updateFormField(event) {
    const { name, value, type, checked } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function updateListField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function resetForm() {
    setForm(emptyDoctor);
    setEditingId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function beginEdit(doctor) {
    setEditingId(doctor._id);
    setForm({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: String(doctor.experience),
      consultationFee: String(doctor.consultationFee),
      description: doctor.description || '',
      profileImage: doctor.profileImage || '',
      services: doctor.services.map((service) => (
        typeof service === 'string' ? service : service._id
      )),
      availableDays: doctor.availableDays || [],
      isActive: doctor.isActive
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

    const doctorDetails = {
      ...form,
      experience: Number(form.experience),
      consultationFee: Number(form.consultationFee)
    };

    try {
      if (editingId) {
        await updateDoctor(editingId, doctorDetails);
        setSuccessMessage('Doctor details updated.');
      } else {
        await createDoctor(doctorDetails);
        setSuccessMessage('Doctor added.');
      }

      setForm(emptyDoctor);
      setEditingId('');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to save doctor details.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(doctor) {
    if (!window.confirm(`Deactivate ${doctor.name}?`)) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deactivateDoctor(doctor._id);
      setSuccessMessage(`${doctor.name} was deactivated.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to deactivate this doctor.'
      );
    }
  }

  async function handleReactivate(doctor) {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateDoctor(doctor._id, { isActive: true });
      setSuccessMessage(`${doctor.name} was reactivated.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to reactivate this doctor.'
      );
    }
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Administrator</p>
        <h1>Doctor management</h1>
        <p>Add, update, and deactivate doctor profiles.</p>
      </section>

      <section className="management-panel" aria-labelledby="doctor-form-title">
        <h2 id="doctor-form-title">{editingId ? 'Edit doctor' : 'Add a doctor'}</h2>
        <form className="management-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Full name</span>
            <input name="name" value={form.name} onChange={updateFormField} required minLength="2" maxLength="100" />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={updateFormField} required />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input name="phone" type="tel" value={form.phone} onChange={updateFormField} required />
          </label>
          <label className="form-field">
            <span>Specialization</span>
            <input name="specialization" value={form.specialization} onChange={updateFormField} required maxLength="80" />
          </label>
          <label className="form-field">
            <span>Qualification</span>
            <input name="qualification" value={form.qualification} onChange={updateFormField} required maxLength="160" />
          </label>
          <label className="form-field">
            <span>Years of experience</span>
            <input name="experience" type="number" min="0" max="80" step="1" value={form.experience} onChange={updateFormField} required />
          </label>
          <label className="form-field">
            <span>Consultation fee (INR)</span>
            <input name="consultationFee" type="number" min="0" step="0.01" value={form.consultationFee} onChange={updateFormField} required />
          </label>
          <label className="form-field">
            <span>Profile image URL (optional)</span>
            <input
              name="profileImage"
              type="text"
              value={form.profileImage}
              onChange={updateFormField}
              placeholder="https://... or /images/doctor.jpg"
            />
          </label>
          <label className="form-field full-width-field">
            <span>Short profile description</span>
            <textarea name="description" rows="3" maxLength="2000" value={form.description} onChange={updateFormField} />
          </label>
          <label className="form-field full-width-field">
            <span>Services (hold Ctrl or Command to select multiple)</span>
            <select
              multiple
              size="5"
              value={form.services}
              onChange={(event) => updateListField(
                'services',
                Array.from(event.target.selectedOptions, (option) => option.value)
              )}
            >
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}{service.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="day-selector full-width-field">
            <legend>Available weekdays</legend>
            <div className="weekday-options">
              {weekdays.map((day) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={form.availableDays.includes(day)}
                    onChange={(event) => updateListField(
                      'availableDays',
                      event.target.checked
                        ? [...form.availableDays, day]
                        : form.availableDays.filter((selectedDay) => selectedDay !== day)
                    )}
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          {editingId && (
            <label className="checkbox-field full-width-field">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={updateFormField}
              />
              Active profile
            </label>
          )}
          {errorMessage && <p className="form-error full-width-field" role="alert">{errorMessage}</p>}
          {successMessage && <p className="form-success full-width-field" role="status">{successMessage}</p>}
          <div className="form-actions full-width-field">
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingId ? 'Save changes' : 'Add doctor')}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="management-list" aria-labelledby="doctor-list-title">
        <h2 id="doctor-list-title">Doctor profiles</h2>
        {isLoading && <p className="page-state" role="status">Loading doctors...</p>}
        {!isLoading && !errorMessage && doctors.length === 0 && (
          <p className="page-state">No doctor profiles have been added.</p>
        )}
        {!isLoading && doctors.length > 0 && (
          <div className="management-cards">
            {doctors.map((doctor) => (
              <article className="management-card" key={doctor._id}>
                <div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialization} · {doctor.email}</p>
                  <span className={doctor.isActive ? 'status-pill' : 'status-pill inactive-pill'}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="management-actions">
                  <button className="secondary-button" type="button" onClick={() => beginEdit(doctor)}>
                    Edit
                  </button>
                  {doctor.isActive ? (
                    <button className="danger-button" type="button" onClick={() => handleDeactivate(doctor)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className="secondary-button" type="button" onClick={() => handleReactivate(doctor)}>
                      Reactivate
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDoctors;
