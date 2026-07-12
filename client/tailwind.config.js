/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        night: "#0b0d12",
        mist: "#10141d",
        ivory: "#f7f4ef",
        ember: "#ff7a59",
        jade: "#24d39a",
        sky: "#4cc9f0",
        gold: "#f6c453",
      },
      boxShadow: {
        glow: "0 18px 40px rgba(255, 122, 89, 0.2)",
        card: "0 12px 30px rgba(12, 16, 24, 0.4)",
      },
    },
  },
  plugins: [],
};
