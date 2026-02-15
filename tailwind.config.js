/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          850: "#0f0f0f",
          800: "#141414",
          700: "#1b1b1b",
          600: "#232323"
        },
        muted: "#a1a1a1",
        accent: "#facc15"
      },
      fontFamily: {
        display: ["\"Satoshi\"", "\"Helvetica Neue\"", "Arial", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(125, 211, 252, 0.15)"
      }
    }
  },
  plugins: []
};
