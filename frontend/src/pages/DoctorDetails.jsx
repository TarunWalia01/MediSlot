import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  createAppointment,
  getDoctor,
  getDoctorSchedules
} from '../services/api.js';
import { getClinicToday } from '../services/dateTime.js';

function DoctorDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getClinicToday());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('');
  const [refreshAvailability, setRefreshAvailability] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [slotError, setSlotError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const schedule = schedules[0];

  useEffect(() => {
    let isCurrent = true;

    async function loadDoctor() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await getDoctor(id);
        if (isCurrent) {
          setDoctor(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error.response?.data?.message || 'Unable to load this doctor profile.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDoctor();
    return () => {
      isCurrent = false;
    };
  }, [id]);

  useEffect(() => {
    let isCurrent = true;

    async function loadAvailability() {
      setIsLoadingSlots(true);
      setSlotError('');
      setSelectedSlot('');
      setSchedules([]);
      setBookingMessage('');

      try {
        const result = await getDoctorSchedules(id, { date: selectedDate });
        if (isCurrent) {
          setSchedules(result.data);
        }
      } catch (error) {
        if (isCurrent) {
          setSchedules([]);
          setSlotError(error.response?.data?.message || 'Unable to load appointment slots.');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadAvailability();
    return () => {
      isCurrent = false;
    };
  }, [id, selectedDate, refreshAvailability]);

  useEffect(() => {
    if (!doctor?.services?.length) {
      return;
    }

    const availableServices = doctor.services.filter(
      (service) => service.isActive !== false
        && (!schedule || service.duration <= schedule.slotDuration)
    );
    setSelectedService((currentService) => (
      availableServices.some((service) => service._id === currentService)
        ? currentService
        : availableServices[0]?._id || ''
    ));
  }, [doctor, schedule?.slotDuration]);

  if (isLoading) {
    return <main className="content-page"><p className="page-state" role="status">Loading doctor profile...</p></main>;
  }

  if (errorMessage || !doctor) {
    return (
      <main className="content-page">
        <p className="page-state error-state" role="alert">
          {errorMessage || 'Doctor not found.'}
        </p>
        <Link className="secondary-button" to="/doctors">Back to doctors</Link>
      </main>
    );
  }

  const initials = doctor.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const services = (doctor.services || []).filter(
    (service) => service.isActive !== false
      && (!schedule || service.duration <= schedule.slotDuration)
  );

  async function handleBooking(event) {
    event.preventDefault();
    if (!schedule || !selectedSlot || !selectedService) {
      setSlotError('Choose an appointment slot and service before booking.');
      return;
    }

    setIsBooking(true);
    setSlotError('');
    setBookingMessage('');
    try {
      await createAppointment({
        doctorId: doctor._id,
        scheduleId: schedule._id,
        serviceId: selectedService,
        slotStartTime: selectedSlot,
        reason
      });
      setBookingMessage('Your appointment request was booked. View its status in My appointments.');
      setSelectedSlot('');
      setReason('');
      setRefreshAvailability((version) => version + 1);
    } catch (error) {
      setSlotError(error.response?.data?.message || 'Unable to book this appointment slot.');
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <main className="content-page">
      <Link className="back-link" to="/doctors">Back to all doctors</Link>
      <article className="doctor-profile">
        {doctor.profileImage ? (
          <img className="profile-photo" src={doctor.profileImage} alt={doctor.name} />
        ) : (
          <div className="profile-photo doctor-initials" aria-hidden="true">{initials}</div>
        )}
        <div className="profile-content">
          <p className="eyebrow">{doctor.specialization}</p>
          <h1>{doctor.name}</h1>
          <p className="profile-qualification">{doctor.qualification}</p>
          <div className="profile-facts">
            <p><strong>{doctor.experience}</strong> years of experience</p>
            <p><strong>₹{Number(doctor.consultationFee).toLocaleString('en-IN')}</strong> consultation fee</p>
          </div>
          {doctor.description && (
            <section className="profile-section">
              <h2>About</h2>
              <p>{doctor.description}</p>
            </section>
          )}
          {doctor.availableDays?.length > 0 && (
            <section className="profile-section">
              <h2>Available days</h2>
              <p>{doctor.availableDays.join(', ')}</p>
            </section>
          )}
          <section className="profile-section">
            <h2>Services</h2>
            {doctor.services?.length > 0 ? (
              <ul className="service-tags">
                {doctor.services.map((service) => (
                  <li key={service._id}>{service.name}</li>
                ))}
              </ul>
            ) : (
              <p>Service details are not listed yet.</p>
            )}
          </section>
            <section className="profile-section booking-panel" aria-labelledby="booking-title">
              <h2 id="booking-title">Book an appointment</h2>
              <label className="form-field">
                <span>Appointment date</span>
                <input
                  type="date"
                  min={getClinicToday()}
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedService('');
                    setSchedules([]);
                  }}
                />
              </label>
              {isLoadingSlots && <p className="page-state" role="status">Loading available slots...</p>}
              {!isLoadingSlots && slotError && <p className="form-error" role="alert">{slotError}</p>}
              {!isLoadingSlots && !slotError && !schedule && (
                <p className="page-state">No appointment slots are available on this date.</p>
              )}
              {schedule && (
                <>
                  <p className="booking-date">
                    {schedule.dayOfWeek}, {schedule.date} · {schedule.slotDuration}-minute slots
                  </p>
                  {services.length === 0 ? (
                    <p className="page-state">
                      No active doctor service fits this schedule. Please contact the clinic.
                    </p>
                  ) : (
                    <form className="booking-form" onSubmit={handleBooking}>
                      <label className="form-field">
                        <span>Service</span>
                        <select
                          value={selectedService}
                          onChange={(event) => setSelectedService(event.target.value)}
                          required
                        >
                          <option value="">Select a service</option>
                          {services.map((service) => (
                            <option key={service._id} value={service._id}>
                              {service.name} · ₹{Number(service.fee).toLocaleString('en-IN')} · {service.duration} min
                            </option>
                          ))}
                        </select>
                      </label>
                      <fieldset className="slot-selector">
                        <legend>Available time slots</legend>
                        {schedule.slots.length > 0 ? (
                          <div className="slot-options">
                            {schedule.slots.map((slot) => (
                              <label className="slot-option" key={slot.startTime}>
                                <input
                                  type="radio"
                                  name="appointment-slot"
                                  value={slot.startTime}
                                  checked={selectedSlot === slot.startTime}
                                  onChange={() => setSelectedSlot(slot.startTime)}
                                  required
                                />
                                <span>{slot.startTimeLocal} - {slot.endTimeLocal}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p>No appointment slots are available on this date.</p>
                        )}
                      </fieldset>
                      <label className="form-field">
                        <span>Reason for visit (optional)</span>
                        <textarea
                          rows="3"
                          maxLength="500"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                        />
                      </label>
                      {!user ? (
                        <p className="page-state">
                          <Link to="/login">Log in</Link> as a patient to book this appointment.
                        </p>
                      ) : user.role !== 'patient' ? (
                        <p className="page-state">Only patient accounts can book appointments.</p>
                      ) : (
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={isBooking || !schedule.slots.length}
                        >
                          {isBooking ? 'Booking...' : 'Book appointment'}
                        </button>
                      )}
                    </form>
                  )}
                </>
              )}
              {bookingMessage && (
                <p className="form-success" role="status">
                  {bookingMessage} <Link to="/appointments">My appointments</Link>
                </p>
              )}
            </section>
        </div>
      </article>
    </main>
  );
}

export default DoctorDetails;
