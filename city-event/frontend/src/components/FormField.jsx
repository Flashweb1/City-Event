import React from 'react';

const FormField = ({
  label,
  name,
  error,
  children,
  ...props
}) => {
  const labelStyle = {
    display: 'block',
    marginBottom: 'var(--spacing-xs)',
    color: 'var(--light-gray)',
    fontWeight: '600'
  };

  const errorStyle = {
    color: 'var(--neon-pink)',
    fontSize: '0.8rem',
    marginTop: '0.25rem'
  };

  return (
    <div {...props}>
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default FormField;