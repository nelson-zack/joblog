/** @type {import('tailwindcss').Config} */
// tailwind.config.js
export default {
  darkMode: 'class', // Enables toggling dark mode via a class
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        light: {
          accent: '#8E9775',
          accentHover: '#7c8667',
          text: '#101010',
          background: '#F9F9F6',
          card: '#FFFFFF',
          tag: {
            remoteBg: '#eef2e1',
            remoteText: '#5a6541',
            referralBg: '#ecfccb',
            referralText: '#365314',
            urgentBg: '#ffedd5',
            urgentText: '#c2410c',
            startupBg: '#fef9c3',
            startupText: '#a16207',
          },
        },
        dark: {
          accent: '#06b6d4', // cyan-500
          accentHover: '#22d3ee', // cyan-400
          text: '#e5e7eb',
          background: '#101010',
          card: '#151515',
          tag: {
            bg: '#0e7490', // dark cyan bg for all tags
            text: '#ffffff'
          },
        },
      },
    },
  },
  plugins: [],
}