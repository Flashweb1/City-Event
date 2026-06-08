import PropTypes from 'prop-types';

/**
 * LoadingButton Component
 * Automatically disables and shows loading spinner during submission
 */
export function LoadingButton({ 
  loading = false, 
  disabled = false, 
  children, 
  className = 'btn-primary',
  ...props 
}) {
  return (
    <button
      disabled={loading || disabled}
      className={className}
      style={{
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...props.style
      }}
      {...props}
    >
      {loading && <div className="spinner" style={{ width: '16px', height: '16px' }} />}
      {children}
    </button>
  );
}

LoadingButton.propTypes = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default LoadingButton;
