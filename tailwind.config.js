/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#F5F1E8',
          100: '#E8DDD1',
          200: '#DDD0C2',
          300: '#D4C4B0',
          400: '#C4A484',
          500: '#A0826D',
          600: '#8B6F47',
          700: '#6B5238',
          800: '#4A3625',
          900: '#2A1F15',
          950: '#1c1c1e',
        },
        beige: {
          50: '#FEFCFB',
          100: '#FAF7F3',
          200: '#F5F1E8',
          300: '#F0E6D2',
          400: '#E8DDD1',
          500: '#DDD0C2',
          600: '#D4C4B0',
          700: '#C4A484',
        },
      },
    },
  },
}

