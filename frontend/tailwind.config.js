/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00D4FF",
        secondary: "#7C3AED",
        dark: "#0F172A",
        darker: "#030712",
        accent: "#06B6D4",
      },
      backgroundImage: {
        "gradient-dark": "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        "gradient-glow": "linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.5)",
        "glow-lg": "0 0 40px rgba(0, 212, 255, 0.3), 0 0 80px rgba(124, 58, 237, 0.2)",
      },
    },
  },
  plugins: [],
}
