// filename: client/tailwind.config.js
/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        "brand-navy": "#2c3e50",
        "brand-navy-dark": "#1d2d3e",
        "brand-teal": "#1abc9c",
        "brand-gold": "#c59d5f",
        "brand-light": "#f8f9f9",
        "brand-orange": "#e67e22",
        "brand-orange-light": "#f39c12",
      }
    },
  },
  plugins: [],
}