import type { Config } from "tailwindcss";

// Colours are CSS-variable driven (see styles/globals.css) so every existing
// utility (text-gold, bg-cosmic-900/60, border-gold/20 …) follows the active
// theme. Each variable holds space-separated RGB channels so Tailwind's
// opacity modifiers keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

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
        background: token("background"),
        foreground: token("foreground"),
        gold: {
          DEFAULT: token("accent"),
          light: token("accent-strong"),
          dark: token("accent-soft"),
        },
        // Neutral ramp. In the dark theme 50 is the lightest and 950 the
        // darkest; the light theme inverts it, so "text-cosmic-300" is always
        // readable body text and "bg-cosmic-900" is always a surface.
        cosmic: {
          50: token("cosmic-50"),
          100: token("cosmic-100"),
          200: token("cosmic-200"),
          300: token("cosmic-300"),
          400: token("cosmic-400"),
          500: token("cosmic-500"),
          600: token("cosmic-600"),
          700: token("cosmic-700"),
          800: token("cosmic-800"),
          900: token("cosmic-900"),
          950: token("cosmic-950"),
        },
        saffron: {
          DEFAULT: "#FF9933",
          light: "#FFB84D",
          dark: "#CC7A00",
        },
      },
      fontFamily: {
        serif: ["var(--font-sans)", "var(--font-devanagari)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "var(--font-devanagari)", "system-ui", "sans-serif"],
        // Latin is set in Jost; Devanagari glyphs fall through to Noto Sans Devanagari.
        devanagari: ["var(--font-sans)", "var(--font-devanagari)", "system-ui", "sans-serif"],
        // Legacy aliases — every face is now Jost.
        cinzel: ["var(--font-sans)", "system-ui", "sans-serif"],
        cormorant: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "gold": "0 0 0 4px rgb(var(--accent) / 0.15)",
        "gold-lg": "0 0 0 6px rgb(var(--accent) / 0.2)",
        "cosmic": "0 8px 32px rgb(var(--shadow) / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
