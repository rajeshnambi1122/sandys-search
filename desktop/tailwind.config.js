/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans"],
      },
      colors: {
        primary: "#ea550c",
        secondary: "#fb923c",
        dark: "#1e293b",
      },
    },
  },
  plugins: [],
}
