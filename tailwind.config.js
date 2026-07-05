/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0E0E12",
          900: "#15151B",
          850: "#1B1B23",
          800: "#22222C",
          700: "#2D2D3A",
          600: "#3A3A4A",
          500: "#52525F",
          400: "#6E6E7E",
          300: "#9A9AA8",
          200: "#C2C2CD",
          100: "#E6E6EC",
        },
        amber: {
          DEFAULT: "#F5B642",
          dark: "#D89A28",
          soft: "rgba(245,182,66,0.14)",
        },
        teal: {
          DEFAULT: "#3DD6C8",
          soft: "rgba(61,214,200,0.16)",
        },
        danger: "#E5484D",
      },
      fontFamily: {
        display: ['"Sora"', "system-ui", "sans-serif"],
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,182,66,0.4), 0 0 40px rgba(245,182,66,0.18)",
        panel: "0 8px 30px rgba(0,0,0,0.35)",
        handle: "0 2px 6px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
