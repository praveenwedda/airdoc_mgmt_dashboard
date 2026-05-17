/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          white: '#FFFFFF',
          border: '#D2D2D7',
          'border-light': '#E5E5EA',
          blue: '#0071E3',
          'blue-hover': '#0077ED',
          red: '#FF3B30',
          green: '#34C759',
          'text-secondary': '#6E6E73',
          'active-bg': '#EBF4FF',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px',
        'apple-pill': '980px',
      },
      boxShadow: {
        'apple': '0 2px 12px rgba(0,0,0,0.08)',
        'apple-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
      letterSpacing: {
        'heading': '-0.02em',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
