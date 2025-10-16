/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      backdropFilter: {
        none: "none",
        md: "blur(8px)",
      },
    },
  },
  variants: {
    extend: {
      backdropFilter: ["responsive", "hover"],
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".backdrop-blur-md": {
          "backdrop-filter": "blur(8px)",
          "-webkit-backdrop-filter": "blur(8px)",
        },
      });
    },
  ],
};
