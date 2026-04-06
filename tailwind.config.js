/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: '#16A34A',
        overlay: 'rgba(255, 255, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
