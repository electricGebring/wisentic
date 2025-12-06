/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",  // Måste inkludera .vue!
  ],
  safelist: [
    'bg-pink-500',
    'text-white',
    'p-4',
    'rounded-xl',
    'bg-red-50',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}