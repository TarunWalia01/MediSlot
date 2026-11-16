import { useEffect, useState } from 'react';
import DoctorCard from '../components/DoctorCard.jsx';
import { getDoctors, getServices } from '../services/api.js';

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    service: '',
    sort: 'name',
    order: 'asc',
    page: 1,
    limit: 9
  });
  const [searchForm, setSearchForm] = useState({
    search: '',
    specialization: '',
    service: '',
    sorting: 'name:asc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadDoctors() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await getDoctors(filters);
        if (isCurrent) {
          setDoctors(result.data);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            error.response?.data?.message || 'Unable to load doctors right now.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDoctors();
    return () => {
      isCurrent = false;
    };
  }, [filters]);

  useEffect(() => {
    let isCurrent = true;

    async function loadServices() {
      try {
        const result = await getServices({ limit: 100, sort: 'name', order: 'asc' });
        if (isCurrent) {
          setServices(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setServiceError(
            error.response?.data?.message || 'Service filters are unavailable.'
          );
        }
      }
    }

    loadServices();
    return () => {
      isCurrent = false;
    };
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const [sort, order] = searchForm.sorting.split(':');
    setFilters((currentFilters) => ({
      ...currentFilters,
      search: searchForm.search.trim(),
      specialization: searchForm.specialization.trim(),
      service: searchForm.service,
      sort,
      order,
      page: 1
    }));
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Find your care team</p>
        <h1>Our doctors</h1>
        <p>Search verified doctor profiles and find the right specialty for your needs.</p>
      </section>

      <form className="filter-panel" onSubmit={handleSearchSubmit}>
        <label className="filter-field">
          <span>Name or specialty</span>
          <input
            type="search"
            value={searchForm.search}
            onChange={(event) => setSearchForm({ ...searchForm, search: event.target.value })}
            placeholder="Search doctors"
          />
        </label>
        <label className="filter-field">
          <span>Specialization</span>
          <input
            type="search"
            value={searchForm.specialization}
            onChange={(event) => setSearchForm({
              ...searchForm,
              specialization: event.target.value
            })}
            placeholder="e.g. Cardiology"
          />
        </label>
        <label className="filter-field">
          <span>Service</span>
          <select
            value={searchForm.service}
            onChange={(event) => setSearchForm({ ...searchForm, service: event.target.value })}
          >
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service._id} value={service._id}>{service.name}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Sort by</span>
          <select
            value={searchForm.sorting}
            onChange={(event) => setSearchForm({ ...searchForm, sorting: event.target.value })}
          >
            <option value="name:asc">Name (A to Z)</option>
            <option value="consultationFee:asc">Fee (low to high)</option>
            <option value="consultationFee:desc">Fee (high to low)</option>
            <option value="experience:desc">Experience (high to low)</option>
          </select>
        </label>
        <button className="primary-button filter-submit" type="submit">Search</button>
      </form>
      {serviceError && <p className="inline-notice" role="status">{serviceError}</p>}

      {isLoading && <p className="page-state" role="status">Loading doctors...</p>}
      {!isLoading && errorMessage && (
        <p className="page-state error-state" role="alert">{errorMessage}</p>
      )}
      {!isLoading && !errorMessage && doctors.length === 0 && (
        <p className="page-state">No doctors match these filters. Try changing your search.</p>
      )}
      {!isLoading && !errorMessage && doctors.length > 0 && (
        <>
          <div className="doctor-grid">
            {doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Doctor list pages">
              <button
                className="secondary-button"
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                className="secondary-button"
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

export default Doctors;
