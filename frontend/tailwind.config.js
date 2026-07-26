/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rausch: "#FF385C", // Airbnb's signature coral/red brand accent
        rausch_dark: "#E31C5F",
        ink: "#222222",
        subtle: "#717171",
        hairline: "#DDDDDD",
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.12)",
        pop: "0 2px 8px rgba(0,0,0,0.18)",
      },
      borderRadius: {
        xl2: "16px",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        slideUp: "slideUp 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
