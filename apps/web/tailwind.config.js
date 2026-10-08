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
          50: "hsl(262, 100%, 97%)",
          100: "hsl(262, 90%, 93%)",
          200: "hsl(262, 80%, 85%)",
          300: "hsl(262, 75%, 75%)",
          400: "hsl(262, 70%, 65%)",
          500: "hsl(262, 67%, 55%)",
          600: "hsl(262, 65%, 45%)",
          700: "hsl(262, 65%, 37%)",
          800: "hsl(262, 60%, 28%)",
          900: "hsl(262, 55%, 20%)",
          950: "hsl(262, 50%, 12%)",
        },
        gold: {
          300: "hsl(42, 90%, 75%)",
          400: "hsl(42, 85%, 60%)",
          500: "hsl(42, 80%, 50%)",
          600: "hsl(42, 75%, 42%)",
        },
        surface: {
          DEFAULT: "hsl(240, 10%, 8%)",
          50: "hsl(240, 8%, 12%)",
          100: "hsl(240, 7%, 16%)",
          200: "hsl(240, 6%, 22%)",
          300: "hsl(240, 5%, 30%)",
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
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, hsl(262,67%,20%) 0%, hsl(240,50%,8%) 50%, hsl(220,60%,12%) 100%)",
        shimmer: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
