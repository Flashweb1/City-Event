import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/auth';
import { useToast } from '../contexts/ToastContext';
import { validateLoginForm, validateRegisterForm } from '../utils/validationSchemas';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      success('Login successful! Redirecting...');
      setTimeout(() => navigate(from, { replace: true }), 500);
    } catch (err) {
      const message = err.message
        ?.replace('Firebase: ', '')
        ?.replace(/\(auth\/.*\)/, '')
        || 'Google sign-in failed';
      if (err.code !== 'auth/popup-closed-by-user') {
        showError(message);
      }
    } finally {
      setGoogleLoading(false);
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
      <motion.div
        className="auth-form-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Helmet><title>Reset Password — City Event</title></Helmet>
        <motion.div className="auth-form-card" variants={fadeUp} initial="hidden" animate="visible">
          <h2 style={{
            textAlign: 'center',
            marginBottom: '1rem',
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            color: '#ffffff'
          }}>
            Reset Password
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email</label>
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
                marginTop: '0.5rem',
                opacity: resetLoading ? 0.5 : 1,
                cursor: resetLoading ? 'wait' : 'pointer'
              }}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <button
            onClick={() => setShowResetPassword(false)}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '1rem',
              marginTop: '1rem'
            }}
          >
            ← Back to Login
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="auth-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Helmet>
        <title>{isLogin ? 'Login' : 'Sign Up'} — City Event</title>
        <meta name="description" content={isLogin ? 'Login to your City Event account' : 'Create a City Event account'} />
      </Helmet>
      <motion.div className="auth-form-card" variants={fadeUp} initial="hidden" animate="visible">
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1rem',
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: '#ffffff',
          letterSpacing: '0.02em'
        }}>
          CITY EVENT
        </h2>

        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: '1.5rem',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: isLogin ? 'var(--neon-cyan)' : 'transparent',
              color: isLogin ? 'var(--bg-deep)' : 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
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
              background: !isLogin ? 'var(--neon-cyan)' : 'transparent',
              color: !isLogin ? 'var(--bg-deep)' : 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
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
            <div style={{ marginBottom: '1rem' }}>
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required={!isLogin}
                style={{
                  borderColor: validationErrors.fullName ? 'var(--neon-pink)' : ''
                }}
              />
              {validationErrors.fullName && (
                <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.fullName}
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={{
                borderColor: validationErrors.email ? 'var(--neon-pink)' : ''
              }}
            />
            {validationErrors.email && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                borderColor: validationErrors.password ? 'var(--neon-pink)' : ''
              }}
            />
            {validationErrors.password && (
              <p style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '1rem' }}>
              <label>Account Type</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                <option value="student" style={{ background: '#1a1a1a' }}>Attendee</option>
                <option value="organizer" style={{ background: '#1a1a1a' }}>Event Organizer</option>
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
              marginTop: '1rem',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {isLogin && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '1.5rem 0',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem'
            }}>
              <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span>or continue with</span>
              <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              aria-label="Sign in with Google"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: (googleLoading || loading) ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                opacity: (googleLoading || loading) ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                if (!googleLoading && !loading) {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.background = 'rgba(0,255,255,0.06)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <GoogleIcon />
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </>
        )}

        {isLogin && (
          <button
            onClick={() => setShowResetPassword(true)}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '1rem'
            }}
          >
            Forgot Password?
          </button>
        )}

        {import.meta.env.VITE_DEMO_EMAIL && import.meta.env.VITE_DEMO_PASSWORD && isLogin && (
          <div className="glass" style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              <strong className="neon-text-cyan">Demo Account:</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
              Email: {import.meta.env.VITE_DEMO_EMAIL}<br />
              Password: {import.meta.env.VITE_DEMO_PASSWORD}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
