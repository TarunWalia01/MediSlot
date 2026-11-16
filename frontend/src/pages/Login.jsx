import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const emailPattern = /^\S+@\S+\.\S+$/;

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to log in. Please try again.';
}

function Login() {
  const { isLoading, user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <main className="page auth-page"><p role="status">Checking your sign-in status...</p></main>;
  }

  if (user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin/appointments' : '/appointments'}
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const signedInUser = await login({ email: email.trim(), password });
      navigate(
        signedInUser.role === 'admin' ? '/admin/appointments' : '/appointments',
        { replace: true }
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Log in to MediSlot</h1>
        {location.state?.registered && (
          <p className="form-success" role="status">
            Your account was created. Log in to continue.
          </p>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <span className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          New to MediSlot? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
