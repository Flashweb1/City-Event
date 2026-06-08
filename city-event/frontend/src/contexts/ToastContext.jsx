import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

/**
 * Toast notification context
 * Provides methods to show success, error, and info messages
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration = 5000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const warn = useCallback((message, duration) => {
    return addToast(message, 'warn', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warn }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Toast Container Component - Displays all active toasts
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div 
      role="region" 
      aria-live="polite" 
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function Toast({ id, message, type, onClose }) {
  const bgColors = {
    success: '#0284c7',
    error: '#db2777',
    warn: '#ca8a04',
    info: '#8b5cf6'
  };

  const textColor = '#ffffff';

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        background: bgColors[type],
        color: textColor,
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        animation: 'slideIn 0.3s ease',
        pointerEvents: 'auto',
        fontWeight: '500',
        fontSize: '0.95rem'
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{
          background: 'rgba(0,0,0,0.2)',
          color: textColor,
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          padding: 0,
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.3)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.2)'}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Custom hook to use toast notifications
 * Usage: const { success, error } = useToast();
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
