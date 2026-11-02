import type { Config } from 'tailwindcss';

// Tailwind is used by the dashboard only; the landing page has its own stylesheet.
export default {
  content: ['./app/index.html', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: '#0C1F24', deep: '#081619', line: '#21454D' },
        ink: { DEFAULT: '#E8F1EE', muted: '#9DBDB7', faint: '#6E918B' },
        solar: '#F2B33D',
        wind: '#6FD6E8',
        battery: '#B79CFF',
        ev: '#FF8A6B',
        ok: '#7BE0A6',
        warn: '#F2B33D',
        bad: '#FF7A7A',
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
      },
      borderRadius: { tile: '10px', panel: '14px' },
    },
  },
  plugins: [],
} satisfies Config;
