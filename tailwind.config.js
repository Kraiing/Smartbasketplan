/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'court-floor': '#E1B87E',
      },
      boxShadow: {
        'player': '0 2px 10px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}