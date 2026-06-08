import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { validateLoginForm, validateRegisterForm } from '../utils/validationSchemas';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student'
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = isLogin ? validateLoginForm(formData) : validateRegisterForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        success('Login successful! Redirecting...');
      } else {
        await register(formData);
        success('Account created! Welcome to City Event!');
      }
      setTimeout(() => navigate(from, { replace: true }), 500);
    } catch (err) {
      const message = err.message
        ?.replace('Firebase: ', '')
        ?.replace(/\(auth\/.*\)/, '')
        || 'Authentication failed';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      showError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      success('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
      setResetEmail('');
    } catch (err) {
      const message = err.message
        ?.replace('Firebase: ', '')
        ?.replace(/\(auth\/.*\)/, '')
        || 'Failed to send reset email';
      showError(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: null
      }));
    }
  };

  // Password Reset Form
  if (showResetPassword) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-md)',
        background: '#F8FAFC'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          background: '#FFFFFF',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-md)',
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            color: '#0F172A'
          }}>
            Reset Password
          </h2>

          <p style={{
            color: '#64748B',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                marginTop: 'var(--spacing-sm)',
                opacity: resetLoading ? 0.5 : 1,
                cursor: resetLoading ? 'wait' : 'pointer'
              }}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <button
            onClick={() => setShowResetPassword(false)}
            style={{
              width: '100%',
              padding: '1rem',
              marginTop: 'var(--spacing-md)',
              background: 'transparent',
              color: '#4F46E5',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-md)',
      background: '#F8FAFC'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#FFFFFF',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-card)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: '700',
          color: '#0F172A'
        }}>
          CITY EVENT
        </h2>

        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: 'var(--spacing-xl)',
          background: '#F1F5F9',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isLogin ? '#4F46E5' : 'transparent',
              color: isLogin ? '#FFFFFF' : '#64748B',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: !isLogin ? '#4F46E5' : 'transparent',
              color: !isLogin ? '#FFFFFF' : '#64748B',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required={!isLogin}
                style={{
                  borderColor: validationErrors.fullName ? '#EF4444' : ''
                }}
              />
              {validationErrors.fullName && (
                <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.fullName}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              color: '#475569',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={{
                borderColor: validationErrors.email ? '#EF4444' : ''
              }}
            />
            {validationErrors.email && (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              color: '#475569',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                borderColor: validationErrors.password ? '#EF4444' : ''
              }}
            />
            {validationErrors.password && (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                color: 'var(--light-gray)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: '#FFFFFF',
                  border: '2px solid #E2E8F0',
                  borderRadius: '6px',
                  color: '#0F172A',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer'
                }}
              >
                <option value="student">Attendee</option>
                <option value="organizer">Event Organizer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              marginTop: 'var(--spacing-md)',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Forgot Password */}
        {isLogin && (
          <button
            onClick={() => setShowResetPassword(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: 'var(--spacing-md)',
              background: 'transparent',
              border: 'none',
              color: '#4F46E5',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Forgot Password?
          </button>
        )}

        {import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD && isLogin && (
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: '#F8FAFC',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #E2E8F0'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#64748B',
              marginBottom: 'var(--spacing-xs)'
            }}>
              <strong style={{ color: '#4F46E5' }}>Demo Account:</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Email: {import.meta.env.VITE_DEMO_EMAIL}<br />
              Password: {import.meta.env.VITE_DEMO_PASSWORD}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
