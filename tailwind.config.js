/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-4px)' },
        }
      },
      animation: {
        'slide-x': 'slide-x 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
