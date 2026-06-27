/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060912',
        surface: '#101722',
        'surface-secondary': '#161E2D',
        primary: '#3B82F6',
        secondary: '#7C3AED',
        accent: '#06B6D4',
        text: '#F8FAFC',
        muted: '#94A3B8',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        'card-title': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'label': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        button: '16px',
        card: '24px',
        image: '20px',
        input: '16px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
