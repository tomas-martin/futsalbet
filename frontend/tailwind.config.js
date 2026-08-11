/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f3ff',
          100: '#ebe9fe',
          200: '#d9d6fe',
          300: '#bdb4fe',
          400: '#9b8afb',
          500: '#7a5af8',
          600: '#6338f6',
          700: '#5225e2',
          800: '#431eb8',
          900: '#381a94',
          950: '#210e64',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          hover: '#334155',
        },
      },
    },
  },
  plugins: [],
};
