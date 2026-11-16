import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DoctorCard from '../components/DoctorCard.jsx';
import { getDoctors, getHealthStatus, getServices } from '../services/api.js';

const popularSpecializations = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology'
];

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorError, setDoctorError] = useState('');
  const [services, setServices] = useState([]);
  const [serviceError, setServiceError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadHomePage() {
      const results = await Promise.allSettled([
        getHealthStatus(),
        getDoctors({ page: 1, limit: 3, sort: 'experience', order: 'desc' }),
        getServices({ page: 1, limit: 3, sort: 'name', order: 'asc' })
      ]);

      if (!isCurrent) {
        return;
      }

      const [healthResult, doctorResult, serviceResult] = results;
      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
      } else {
        setHealthError('Backend connection status is unavailable.');
      }

      if (doctorResult.status === 'fulfilled') {
        setDoctors(doctorResult.value.data);
      } else {
        setDoctorError('Featured doctors could not be loaded.');
      }

      if (serviceResult.status === 'fulfilled') {
        setServices(serviceResult.value.data);
      } else {
        setServiceError('Services could not be loaded.');
      }

      setIsLoading(false);
    }

    loadHomePage();
    return () => {
      isCurrent = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/doctors?search=${encodeURIComponent(query)}` : '/doctors');
  }

  function searchSpecialization(specialization) {
    navigate(`/doctors?search=${encodeURIComponent(specialization)}`);
  }

  return (
    <main>
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="eyebrow">Care that fits your schedule</p>
          <h1>Find the right doctor. Book with confidence.</h1>
          <p>
            Browse doctor profiles, compare services and find appointment
            availability through one simple place.
          </p>
          <form className="home-search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="doctor-search">
              Doctor name or specialization
            </label>
            <input
              id="doctor-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Doctor name or specialization"
            />
            <button className="primary-button" type="submit">Search doctors</button>
          </form>
          <Link className="hero-secondary-link" to="/doctors">Browse all doctors</Link>
        </div>
        <aside className="connection-panel home-connection" aria-live="polite">
          <h2>System status</h2>
          {isLoading && <p role="status">Checking services...</p>}
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
          {!isLoading && healthError && (
            <p className="status status-error" role="status">{healthError}</p>
          )}
        </aside>
      </section>

      <section className="content-page home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore by specialty</p>
            <h2>Popular specializations</h2>
          </div>
          <Link to="/doctors">View all doctors</Link>
        </div>
        <div className="specialization-list">
          {popularSpecializations.map((specialization) => (
            <button
              className="specialization-chip"
              key={specialization}
              onClick={() => searchSpecialization(specialization)}
              type="button"
            >
              {specialization}
            </button>
          ))}
        </div>
      </section>

      <section className="content-page home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Meet the care team</p>
            <h2>Featured doctors</h2>
          </div>
          <Link to="/doctors">Browse all doctors</Link>
        </div>
        {isLoading && <p className="page-state" role="status">Loading doctors...</p>}
        {!isLoading && doctorError && (
          <p className="page-state error-state" role="alert">{doctorError}</p>
        )}
        {!isLoading && !doctorError && doctors.length === 0 && (
          <p className="page-state">No active doctor profiles are available yet.</p>
        )}
        {!isLoading && !doctorError && doctors.length > 0 && (
          <div className="doctor-grid">
            {doctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor._id} />)}
          </div>
        )}
      </section>

      <section className="content-page home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Care options</p>
            <h2>Medical services</h2>
          </div>
          <Link to="/services">View all services</Link>
        </div>
        {isLoading && <p className="page-state" role="status">Loading services...</p>}
        {!isLoading && serviceError && (
          <p className="page-state error-state" role="alert">{serviceError}</p>
        )}
        {!isLoading && !serviceError && services.length === 0 && (
          <p className="page-state">No active services are available yet.</p>
        )}
        {!isLoading && !serviceError && services.length > 0 && (
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service._id}>
                <p className="service-card-label">MediSlot service</p>
                <h2>{service.name}</h2>
                <p className="service-description">
                  {service.description || 'Explore this service with our available doctors.'}
                </p>
                <div className="service-card-facts">
                  <span>Fee: {service.fee}</span>
                  <span>{service.duration} min</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="content-page home-section how-it-works">
        <p className="eyebrow">A clear path to care</p>
        <h2>How MediSlot works</h2>
        <ol>
          <li><strong>Find a doctor</strong><span>Search by name or specialization.</span></li>
          <li><strong>Choose a time</strong><span>Review the doctor&apos;s available slots.</span></li>
          <li><strong>Manage your visit</strong><span>Track your appointment from your dashboard.</span></li>
        </ol>
      </section>
    </main>
  );
}

export default Home;
