/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#081419",
        slate: "#10222a",
        surf: "#16a6a4",
        coral: "#ff7b5c",
        sky: "#57c7ff",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        glass: "0 20px 40px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
