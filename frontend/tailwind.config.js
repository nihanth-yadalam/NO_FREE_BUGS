/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F19",
        card: "#111827",
        border: "#1F2937",
        primary: "#6366F1",
        accent: "#22D3EE"
      },

      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        subtleGlow: {
          "0%, 100%": {
            boxShadow: "0 0 0px rgba(99,102,241,0.0)"
          },
          "50%": {
            boxShadow: "0 0 20px rgba(99,102,241,0.25)"
          }
        }
      },

      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "subtle-glow": "subtleGlow 2.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};



