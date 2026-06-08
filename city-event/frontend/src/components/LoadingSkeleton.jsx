import PropTypes from 'prop-types';

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const baseStyles = {
    background: 'var(--medium-gray)',
    borderRadius: 'var(--radius-sm)',
    animation: 'shimmer 2s infinite',
  };

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card" style={{ pointerEvents: 'none', opacity: 0.7 }}>
            {/* Image Skeleton */}
            <div style={{ ...baseStyles, height: '220px', marginBottom: '1rem' }} />
            
            {/* Content */}
            <div style={{ padding: 'var(--spacing-md)' }}>
              {/* Title Skeleton */}
              <div style={{ ...baseStyles, height: '1.5rem', marginBottom: '1rem', width: '80%' }} />
              
              {/* Description Skeleton */}
              <div style={{ ...baseStyles, height: '0.75rem', marginBottom: '0.5rem' }} />
              <div style={{ ...baseStyles, height: '0.75rem', marginBottom: '1.5rem', width: '60%' }} />
              
              {/* Meta Info Skeletons */}
              <div style={{ ...baseStyles, height: '0.9rem', marginBottom: '0.5rem' }} />
              <div style={{ ...baseStyles, height: '0.9rem', marginBottom: '0.5rem' }} />
              <div style={{ ...baseStyles, height: '0.9rem' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ ...baseStyles, height: '100px', padding: 'var(--spacing-md)' }}>
            <div style={{ ...baseStyles, height: '1rem', width: '40%', marginBottom: '0.5rem' }} />
            <div style={{ ...baseStyles, height: '0.75rem', width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div style={{ ...baseStyles, height: '400px', marginBottom: 'var(--spacing-xl)' }} />
    );
  }

  return <div style={{ ...baseStyles, height: '200px' }} />;
}

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'list', 'hero', 'line']),
  count: PropTypes.number
};
