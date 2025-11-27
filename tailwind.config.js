/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx,jsx}',
    './components/**/*.{js,ts,tsx,jsx}',
    './hooks/**/*.{js,ts,tsx,jsx}',
    './screens/**/*.{js,ts,tsx,jsx}',
    './utils/**/*.{js,ts,tsx,jsx}',
    './app/**/*.{js,ts,tsx,jsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: "media",
};