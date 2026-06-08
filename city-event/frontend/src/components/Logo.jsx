import logoImg from '../../logo icon plain background.png';

export default function Logo({ size = 'md', animated = true }) {
  const sizes = {
    sm: { width: '32px', height: '32px', fontSize: '1rem', subSize: '0.55rem' },
    md: { width: '40px', height: '40px', fontSize: '1.1rem', subSize: '0.6rem' },
    lg: { width: '56px', height: '56px', fontSize: '1.3rem', subSize: '0.65rem' },
    xl: { width: '72px', height: '72px', fontSize: '1.5rem', subSize: '0.7rem' }
  };

  const current = sizes[size];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease'
    }}>
      <div style={{
        width: current.width,
        height: current.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        overflow: 'hidden'
      }}>
        <img
          src={logoImg}
          alt="City Event Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {size !== 'sm' && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontSize: current.fontSize,
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: '#0F172A',
            lineHeight: '1.2'
          }}>
            CITY EVENT
          </div>
          <div style={{
            fontSize: current.subSize,
            color: '#64748B',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            Experience Live
          </div>
        </div>
      )}
    </div>
  );
}