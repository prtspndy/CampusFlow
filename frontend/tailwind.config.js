/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Exact Google Stitch "Skyline Nocturne ERP" color tokens
        background: '#051424',
        surface: {
          DEFAULT: '#051424',
          dim: '#051424',
          lowest: '#010f1f',
          low: '#0d1c2d',
          container: '#122131',
          high: '#1c2b3c',
          highest: '#273647',
          bright: '#2c3a4c',
        },
        'on-surface': {
          DEFAULT: '#d4e4fa',
          variant: '#c4c5da',
        },
        outline: {
          DEFAULT: '#8e8fa3',
          variant: '#273647',
        },
        brand: {
          DEFAULT: '#0047FF',
          hover: '#0038CC',
          container: '#0047FF',
          muted: 'rgba(0, 71, 255, 0.15)',
          glow: 'rgba(0, 71, 255, 0.25)',
        },
        cyan: {
          DEFAULT: '#38BDF8',
          secondary: '#7bd0ff',
          muted: 'rgba(56, 189, 248, 0.15)',
        },
        tertiary: {
          DEFAULT: '#4edea3',
          container: '#006e4b',
          'on-container': '#67f4b7',
        },
        dark: {
          canvas: '#051424',
          surface: '#122131',
          sidebar: '#0d1c2d',
          elevated: '#1c2b3c',
          border: '#273647',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          text: '#d4e4fa',
          muted: '#8e8fa3',
        },
        light: {
          canvas: '#F8FAFC',
          surface: '#FFFFFF',
          sidebar: '#FFFFFF',
          elevated: '#F1F5F9',
          border: '#E2E8F0',
          borderSubtle: '#EDF2F7',
          text: '#0F172A',
          muted: '#64748B',
        },
        status: {
          success: {
            text: '#34D399',
            bg: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.25)',
          },
          warning: {
            text: '#FBBF24',
            bg: 'rgba(245, 158, 11, 0.12)',
            border: 'rgba(245, 158, 11, 0.25)',
          },
          error: {
            text: '#F87171',
            bg: 'rgba(239, 68, 68, 0.12)',
            border: 'rgba(239, 68, 68, 0.25)',
          },
          info: {
            text: '#60A5FA',
            bg: 'rgba(0, 71, 255, 0.12)',
            border: 'rgba(0, 71, 255, 0.25)',
          },
        },
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.2)',
        md: '0 2px 8px rgba(0, 0, 0, 0.25)',
        lg: '0 4px 16px rgba(0, 0, 0, 0.35)',
        'brand-glow': '0 0 16px rgba(0, 71, 255, 0.3)',
        'modal-dark': '0 16px 40px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.10)',
        'modal-light': '0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
