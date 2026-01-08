/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        card: "#111827",
        primary: "#4F46E5"
      }
    }
  },
  plugins: []
};
