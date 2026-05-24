import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic – driven by CSS variables (auto-flip on dark mode)
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        "ink-3": "var(--color-ink-3)",
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",

        // Static brand tokens (always the same)
        brand: {
          red: "#CC0000",
          "red-dark": "#990000",
          espresso: "#1A0E07",
          latte: "#C8956B",
          cream: "#FAF7F2",
        },
      },
      ringOffsetColor: {
        bg: "var(--color-bg)",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
        cairo: ["var(--font-cairo)", "Tahoma", "Arial", "sans-serif"],
        sans: ["var(--font-poppins)", "var(--font-cairo)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.07)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.13)",
        "glass": "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      backgroundImage: {
        "coffee-gradient":
          "linear-gradient(135deg, #FAF0E4 0%, #F0D9C0 50%, #E8C9A8 100%)",
        "espresso-gradient":
          "linear-gradient(135deg, #2C1A0E 0%, #1A0E07 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        "shimmer": "shimmer 1.6s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
