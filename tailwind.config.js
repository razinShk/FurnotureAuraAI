/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#eadbc6',
          300: '#dbc1a1',
          400: '#cba57b',
          500: '#c59b63', // Signature Burnished Brass
          600: '#b3884d',
          700: '#946d3b',
          800: '#795832',
          900: '#64482b',
          950: '#382614',
          gold: '#c59b63',
          amber: '#dfb77c',
        },
        luxury: {
          ivory: '#faf8f5',
          cream: '#f3efe8',
          noir: '#121110',
          charcoal: '#1a1918',
          stone: '#242220',
          border: '#e7e3dc',
          darkBorder: '#2b2825',
          brass: '#c59b63',
          champagne: '#dfb77c',
          bronze: '#8c6735',
          black: '#121110',
          dark: '#1a1918',
          surface: '#242220',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'scanline': 'scanline 2.4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { top: '4%', opacity: '0.9' },
          '50%': { top: '92%', opacity: '1' },
          '100%': { top: '4%', opacity: '0.9' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
