import { useEffect, useState } from 'react';
import { getServices } from '../services/api.js';

function Services() {
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'name',
    order: 'asc',
    page: 1,
    limit: 9
  });
  const [searchForm, setSearchForm] = useState({
    search: '',
    minFee: '',
    maxFee: '',
    sorting: 'name:asc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadServices() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await getServices(filters);
        if (isCurrent) {
          setServices(result.data);
          setPagination(result.pagination);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.response?.data?.message || 'Unable to load services right now.');
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
  }, [filters]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const [sort, order] = searchForm.sorting.split(':');
    setFilters((currentFilters) => ({
      ...currentFilters,
      search: searchForm.search.trim(),
      minFee: searchForm.minFee || undefined,
      maxFee: searchForm.maxFee || undefined,
      sort,
      order,
      page: 1
    }));
  }

  return (
    <main className="content-page">
      <section className="page-heading">
        <p className="eyebrow">Care tailored to you</p>
        <h1>Medical services</h1>
        <p>Explore the services currently offered by MediSlot providers.</p>
      </section>
      <form className="filter-panel service-filter-panel" onSubmit={handleSearchSubmit}>
        <label className="filter-field">
          <span>Search services</span>
          <input
            type="search"
            value={searchForm.search}
            onChange={(event) => setSearchForm({ ...searchForm, search: event.target.value })}
            placeholder="Search by name or description"
          />
        </label>
        <label className="filter-field">
          <span>Minimum fee</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={searchForm.minFee}
            onChange={(event) => setSearchForm({ ...searchForm, minFee: event.target.value })}
          />
        </label>
        <label className="filter-field">
          <span>Maximum fee</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={searchForm.maxFee}
            onChange={(event) => setSearchForm({ ...searchForm, maxFee: event.target.value })}
          />
        </label>
        <label className="filter-field">
          <span>Sort by</span>
          <select
            value={searchForm.sorting}
            onChange={(event) => setSearchForm({ ...searchForm, sorting: event.target.value })}
          >
            <option value="name:asc">Name (A to Z)</option>
            <option value="fee:asc">Fee (low to high)</option>
            <option value="fee:desc">Fee (high to low)</option>
            <option value="duration:asc">Duration (short to long)</option>
          </select>
        </label>
        <button className="primary-button filter-submit" type="submit">Apply filters</button>
      </form>
      {isLoading && <p className="page-state" role="status">Loading services...</p>}
      {!isLoading && errorMessage && (
        <p className="page-state error-state" role="alert">{errorMessage}</p>
      )}
      {!isLoading && !errorMessage && services.length === 0 && (
        <p className="page-state">No services are available yet.</p>
      )}
      {!isLoading && !errorMessage && services.length > 0 && (
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service._id}>
              <p className="service-card-label">MediSlot service</p>
              <h2>{service.name}</h2>
              <p className="service-description">
                {service.description || 'Our care team can provide more information about this service.'}
              </p>
              <div className="service-card-facts">
                <span>₹{Number(service.fee).toLocaleString('en-IN')}</span>
                <span>{service.duration} minutes</span>
              </div>
            </article>
          ))}
        </div>
      )}
      {!isLoading && !errorMessage && pagination && pagination.totalPages > 1 && (
        <nav className="pagination" aria-label="Service list pages">
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
    </main>
  );
}

export default Services;
