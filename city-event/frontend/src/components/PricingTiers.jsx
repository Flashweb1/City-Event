import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PricingTiers() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = [
    {
      name: 'Attendee',
      price: 0,
      period: 'Free Forever',
      description: 'Perfect for discovering events',
      color: '#4F46E5',
      features: [
        { text: 'Browse unlimited events', premium: false },
        { text: 'Register for events', premium: false },
        { text: 'Digital tickets (QR codes)', premium: false },
        { text: 'Event reminders', premium: false },
        { text: 'Limited saved events (5)', premium: true },
        { text: 'Priority support', premium: true },
        { text: 'Early access to new events', premium: true }
      ],
      cta: 'Get Started',
      ctaVariant: 'secondary',
      recommended: false
    },
    {
      name: 'Pro Attendee',
      price: billingCycle === 'monthly' ? 9.99 : 99.99,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'For serious event enthusiasts',
      color: '#F59E0B',
      features: [
        { text: 'Browse unlimited events', premium: false },
        { text: 'Register for events', premium: false },
        { text: 'Digital tickets (QR codes)', premium: false },
        { text: 'Event reminders', premium: false },
        { text: 'Unlimited saved events', premium: true },
        { text: 'Priority support', premium: true },
        { text: 'Early access to new events', premium: true },
        { text: 'Exclusive event previews', premium: true },
        { text: 'Group booking discounts', premium: true }
      ],
      cta: 'Upgrade to Pro',
      ctaVariant: 'primary',
      recommended: true
    },
    {
      name: 'Organizer',
      price: billingCycle === 'monthly' ? 29.99 : 299.99,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: 'Full power for event creators',
      color: '#818CF8',
      features: [
        { text: 'Create unlimited events', premium: false },
        { text: 'Advanced analytics', premium: false },
        { text: 'QR code check-in', premium: false },
        { text: 'Email marketing tools', premium: false },
        { text: 'Custom event templates', premium: true },
        { text: 'Revenue sharing (80/20)', premium: true },
        { text: 'Priority support', premium: true },
        { text: 'API access', premium: true },
        { text: 'White-label options', premium: true }
      ],
      cta: 'Start Organizing',
      ctaVariant: 'primary',
      recommended: false
    }
  ];

  return (
    <section style={{
      padding: 'var(--spacing-xxl) 0',
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0'
    }}>
      <style>{`
        .pricing-card {
          animation: slideUp 0.5s ease-out;
        }
        .pricing-card.recommended {
          animation: slideUp 0.5s ease-out 0.1s backwards;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0;
          font-size: 0.9rem;
          color: #475569;
          transition: all 0.2s ease;
        }
        .feature-item.premium {
          color: #4F46E5;
          font-weight: 500;
        }
        .feature-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          flex-shrink: 0;
        }
        .feature-item:not(.premium) .feature-check {
          background: #EEF2FF;
          color: #4F46E5;
        }
        .feature-item.premium .feature-check {
          background: #4F46E5;
          color: #FFFFFF;
        }
      `}</style>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ color: '#0F172A', marginBottom: 'var(--spacing-md)' }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748B',
            maxWidth: '600px',
            margin: '0 auto var(--spacing-lg)'
          }}>
            Choose the perfect plan for your event needs
          </p>

          <div style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            borderRadius: '8px',
            padding: '0.35rem',
            border: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '0.65rem 1.5rem',
                background: billingCycle === 'monthly' ? '#4F46E5' : 'transparent',
                color: billingCycle === 'monthly' ? '#FFFFFF' : '#64748B',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '0.65rem 1.5rem',
                background: billingCycle === 'yearly' ? '#4F46E5' : 'transparent',
                color: billingCycle === 'yearly' ? '#FFFFFF' : '#64748B',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Yearly
              <span style={{
                background: '#F59E0B',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                marginLeft: '0.5rem',
                fontWeight: '700'
              }}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--spacing-lg)',
          alignItems: 'stretch'
        }}>
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`pricing-card ${tier.recommended ? 'recommended' : ''}`}
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: tier.recommended ? `2px solid ${tier.color}` : '1px solid #E2E8F0',
                padding: 'var(--spacing-xl)',
                position: 'relative',
                overflow: 'hidden',
                transform: tier.recommended ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.25s ease',
                boxShadow: tier.recommended ? '0 10px 25px -5px rgba(79,70,229,0.15)' : 'var(--shadow-md)'
              }}
            >
              {tier.recommended && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  padding: '0.4rem 1rem',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  borderRadius: '0 16px 0 8px'
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{
                  color: tier.color,
                  marginBottom: 'var(--spacing-sm)',
                  fontSize: '1.3rem',
                  fontWeight: '700'
                }}>
                  {tier.name}
                </h3>
                <p style={{
                  color: '#64748B',
                  fontSize: '0.9rem'
                }}>
                  {tier.description}
                </p>
              </div>

              <div style={{
                marginBottom: 'var(--spacing-lg)',
                paddingBottom: 'var(--spacing-lg)',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: tier.color,
                  lineHeight: '1'
                }}>
                  ${tier.price === 0 ? 'Free' : tier.price.toFixed(2)}
                </div>
                <p style={{
                  color: '#94A3B8',
                  fontSize: '0.9rem',
                  marginTop: '0.25rem'
                }}>
                  {tier.period}
                </p>
              </div>

              <button
                className={`btn-${tier.ctaVariant}`}
                onClick={() => navigate(tier.name === 'Attendee' ? '/login' : '/login')}
                style={{
                  width: '100%',
                  marginBottom: 'var(--spacing-lg)',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {tier.cta}
              </button>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                {tier.features.map((feature, featureIdx) => (
                  <div
                    key={featureIdx}
                    className={`feature-item ${feature.premium ? 'premium' : ''}`}
                  >
                    <div className="feature-check">✓</div>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}