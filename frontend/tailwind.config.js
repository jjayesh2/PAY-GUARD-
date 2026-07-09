/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#5275ff', // Primary Brand Color
          600: '#2b47fc',
          700: '#1a2ef2',
          800: '#1524c4',
          900: '#15249c',
        },
        dark: {
          50: '#f6f6f9',
          100: '#eef0f5',
          200: '#d7dbec',
          300: '#b1b9dc',
          400: '#828ec7',
          500: '#5e6bb2',
          600: '#465096',
          700: '#383f7a',
          800: '#1e2238', // Card Background Dark
          900: '#0f111a', // Global Background Dark
          950: '#07080f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
