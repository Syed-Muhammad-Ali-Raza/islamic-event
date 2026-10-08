/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Noto Naskh Arabic", "serif"],
      },
      colors: {
        brand: {
          50: "hsl(160, 84%, 95%)",
          100: "hsl(158, 81%, 89%)",
          200: "hsl(156, 81%, 79%)",
          300: "hsl(152, 76%, 65%)",
          400: "hsl(151, 91%, 54%)",
          500: "hsl(157, 81%, 44%)",
          600: "hsl(158, 84%, 36%)",
          700: "hsl(160, 85%, 29%)",
          800: "hsl(160, 84%, 24%)",
          900: "hsl(161, 84%, 20%)",
          950: "hsl(161, 86%, 11%)",
        },
        gold: {
          300: "hsl(42, 90%, 75%)",
          400: "hsl(42, 85%, 60%)",
          500: "hsl(42, 80%, 50%)",
          600: "hsl(42, 75%, 42%)",
        },
        surface: {
          DEFAULT: "hsl(0, 0%, 100%)",
          50: "hsl(220, 20%, 98%)",
          100: "hsl(220, 16%, 96%)",
          200: "hsl(220, 14%, 93%)",
          300: "hsl(220, 12%, 86%)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite",
        "pulse-glow": "pulseGlow 2s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(16, 185, 129, 0.6)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, hsl(162, 70%, 16%) 0%, hsl(168, 55%, 10%) 50%, hsl(175, 45%, 12%) 100%)",
        shimmer: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
