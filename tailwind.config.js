/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        grey: {
          50: "#f9fafb",
          100: "#f3f4f6",
        },
        cb: {
          orange: "#ff3300",
          "orange-light": "#fff4ef",
          navy: "#0e1c26",
          "site-switcher": "#eceef1",
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
        sora: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
