import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0D1117',
        surface: '#161B22',
        'surface-elevated': '#1E2530',
        border: '#2D3748',
        'text-primary': '#F0F4F8',
        'text-muted': '#7A8FA6',
        'text-faint': '#3D4F63',
        indigo: {
          DEFAULT: '#6366F1',
          hover: '#4F52D6',
        },
        gold: {
          DEFAULT: '#F59E0B',
          hover: '#D98708',
        },
        green: {
          DEFAULT: '#10B981',
          hover: '#0EA271',
        },
        red: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
        },
      },
      fontFamily: {
        body: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        card: '10px',
        control: '8px',
        pill: '999px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
          '100%': { boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
