import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

function Register() {
  const { isLoading, user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <main className="page auth-page"><p role="status">Checking your sign-in status...</p></main>;
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/appointments'} replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    if (Object.values(form).some((value) => !value.trim())) {
      setErrorMessage('Complete all fields to create your account.');
      return;
    }

    if (form.name.trim().length < 2 || form.name.trim().length > 80) {
      setErrorMessage('Name must be between 2 and 80 characters.');
      return;
    }

    if (!emailPattern.test(form.email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!phonePattern.test(form.phone.trim())) {
      setErrorMessage('Enter a valid phone number.');
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (new TextEncoder().encode(form.password).length > 72) {
      setErrorMessage('Password must be no more than 72 bytes.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Unable to create the account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <p className="eyebrow">Join MediSlot</p>
        <h1 id="register-title">Create your account</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Full name</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              required
            />
          </label>
          <label className="form-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label className="form-field">
            <span>Phone number</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={updateField}
              required
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <span className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
                required
              />
              <button
                className="text-button password-toggle"
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          <label className="form-field">
            <span>Confirm password</span>
            <span className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={updateField}
                required
              />
              <button
                className="text-button password-toggle"
                type="button"
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((visible) => !visible)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create patient account'}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
