/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: {
          850: '#1f2937',
          950: '#111827'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
};