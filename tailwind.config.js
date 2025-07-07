/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'float-up': 'floatUp 2s ease-out infinite',
      },
      keyframes: {
        floatUp: {
          '0%': {
            transform: 'translateY(0px)',
            opacity: '0',
          },
          '20%': {
            opacity: '1',
          },
          '80%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-20px)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
}
