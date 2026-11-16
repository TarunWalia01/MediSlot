import { Link } from 'react-router-dom';

function DoctorCard({ doctor }) {
  const initials = doctor.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="doctor-card">
      {doctor.profileImage ? (
        <img className="doctor-photo" src={doctor.profileImage} alt={doctor.name} />
      ) : (
        <div className="doctor-photo doctor-initials" aria-hidden="true">
          {initials}
        </div>
      )}
      <div className="doctor-card-content">
        <p className="card-eyebrow">{doctor.specialization}</p>
        <h2>{doctor.name}</h2>
        <p className="doctor-qualification">{doctor.qualification}</p>
        <p className="doctor-meta">
          {doctor.experience} years of experience
        </p>
        <p className="doctor-fee">
          ₹{Number(doctor.consultationFee).toLocaleString('en-IN')} consultation
        </p>
        {doctor.services?.length > 0 && (
          <p className="doctor-services">
            Services: {doctor.services.map((service) => service.name).join(', ')}
          </p>
        )}
        <Link className="secondary-button" to={`/doctors/${doctor._id}`}>
          View profile
        </Link>
      </div>
    </article>
  );
}

export default DoctorCard;
