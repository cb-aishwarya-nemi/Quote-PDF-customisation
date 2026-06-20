/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cb: {
          sidebar: "#1a2533",
          "sidebar-hover": "#243041",
          "sidebar-active": "#2d3a4d",
          orange: "#ff6b35",
          "test-banner": "#fff8e6",
          "test-banner-text": "#7a5c00",
          "test-badge": "#f5c518",
          "disable-bg": "#ede4d8",
          "disable-border": "#c4a574",
          "disable-text": "#6b4f1d",
          "disable-btn": "#8b6914",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}
