import { useEffect, useState } from 'react';
import {
  createService,
  deactivateService,
  getServices,
  updateService
} from '../services/api.js';

const emptyService = {
  name: '',
  description: '',
  fee: '',
  duration: '',
  isActive: true
};

function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyService);
  const [editingId, setEditingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadServices() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await getServices({
          includeInactive: true,
          page: 1,
          limit: 100,
          sort: 'name',
          order: 'asc'
        });
        if (isCurrent) {
          setServices(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.response?.data?.message || 'Unable to load service management data.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadServices();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function resetForm() {
    setForm(emptyService);
    setEditingId('');
    setErrorMessage('');
    setSuccessMessage('');
  }

  function beginEdit(service) {
    setEditingId(service._id);
    setForm({
      name: service.name,
      description: service.description || '',
      fee: String(service.fee),
      duration: String(service.duration),
      isActive: service.isActive
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

    const serviceDetails = {
      ...form,
      fee: Number(form.fee),
      duration: Number(form.duration)
    };

    try {
      if (editingId) {
        await updateService(editingId, serviceDetails);
        setSuccessMessage('Service details updated.');
      } else {
        await createService(serviceDetails);
        setSuccessMessage('Service added.');
      }

      setForm(emptyService);
      setEditingId('');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to save service details.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(service) {
    if (!window.confirm(`Deactivate ${service.name}?`)) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deactivateService(service._id);
      setSuccessMessage(`${service.name} was deactivated.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to deactivate this service.'
      );
    }
  }

  async function handleReactivate(service) {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await updateService(service._id, { isActive: true });
      setSuccessMessage(`${service.name} was reactivated.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to reactivate this service.'
      );
    }
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Administrator</p>
        <h1>Service management</h1>
        <p>Maintain available medical services, fees, and durations.</p>
      </section>

      <section className="management-panel" aria-labelledby="service-form-title">
        <h2 id="service-form-title">{editingId ? 'Edit service' : 'Add a service'}</h2>
        <form className="management-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Service name</span>
            <input name="name" value={form.name} onChange={updateField} required minLength="2" maxLength="100" />
          </label>
          <label className="form-field">
            <span>Fee (INR)</span>
            <input name="fee" type="number" value={form.fee} onChange={updateField} min="0" step="0.01" required />
          </label>
          <label className="form-field">
            <span>Duration (minutes)</span>
            <input name="duration" type="number" value={form.duration} onChange={updateField} min="5" max="480" step="1" required />
          </label>
          <label className="form-field full-width-field">
            <span>Description</span>
            <textarea name="description" rows="3" maxLength="1000" value={form.description} onChange={updateField} />
          </label>
          {editingId && (
            <label className="checkbox-field full-width-field">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={updateField}
              />
              Active service
            </label>
          )}
          {errorMessage && <p className="form-error full-width-field" role="alert">{errorMessage}</p>}
          {successMessage && <p className="form-success full-width-field" role="status">{successMessage}</p>}
          <div className="form-actions full-width-field">
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingId ? 'Save changes' : 'Add service')}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="management-list" aria-labelledby="service-list-title">
        <h2 id="service-list-title">Available services</h2>
        {isLoading && <p className="page-state" role="status">Loading services...</p>}
        {!isLoading && !errorMessage && services.length === 0 && (
          <p className="page-state">No services have been added.</p>
        )}
        {!isLoading && services.length > 0 && (
          <div className="management-cards">
            {services.map((service) => (
              <article className="management-card" key={service._id}>
                <div>
                  <h3>{service.name}</h3>
                  <p>
                    ₹{Number(service.fee).toLocaleString('en-IN')} · {service.duration} minutes
                  </p>
                  <span className={service.isActive ? 'status-pill' : 'status-pill inactive-pill'}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="management-actions">
                  <button className="secondary-button" type="button" onClick={() => beginEdit(service)}>
                    Edit
                  </button>
                  {service.isActive ? (
                    <button className="danger-button" type="button" onClick={() => handleDeactivate(service)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className="secondary-button" type="button" onClick={() => handleReactivate(service)}>
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

export default AdminServices;
