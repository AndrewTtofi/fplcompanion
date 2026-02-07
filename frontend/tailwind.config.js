/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fpl: {
          purple: '#37003c',
          pink: '#ff2882',
          green: '#00ff87',
          cyan: '#04f5ff',
        },
      },
    },
  },
  plugins: [],
}
