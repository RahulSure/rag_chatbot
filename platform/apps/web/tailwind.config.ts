import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        foreground: "#f4f0e8",
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e2c97e",
          dark: "#9d7a2f",
        },
        cosmic: {
          50: "#f4f0e8",
          100: "#e8e0d0",
          200: "#d4c5a9",
          300: "#bfa882",
          400: "#a88a5c",
          500: "#8a6e3f",
          600: "#6d5430",
          700: "#503c22",
          800: "#342715",
          900: "#1a1208",
          950: "#0a0a0f",
        },
        saffron: {
          DEFAULT: "#FF9933",
          light: "#FFB84D",
          dark: "#CC7A00",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "Arial", "sans-serif"],
      },
      backgroundImage: {
        "cosmic-gradient": "radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)",
        "gold-gradient": "linear-gradient(135deg, #c9a84c 0%, #e2c97e 50%, #9d7a2f 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(201,168,76,0.08) 0%, rgba(10,10,15,0.8) 100%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px rgba(201,168,76,0.2)" },
          to: { boxShadow: "0 0 30px rgba(201,168,76,0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "gold": "0 0 20px rgba(201,168,76,0.3)",
        "gold-lg": "0 0 40px rgba(201,168,76,0.5)",
        "cosmic": "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
