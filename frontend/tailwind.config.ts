import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Original tokens
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        
        // New tokens from design
        "outline-variant": "#5b4038",
        "primary-container": "#ff5a1f",
        "secondary-fixed-dim": "#adc6ff",
        "on-tertiary-fixed-variant": "#005321",
        "surface-container-low": "#1c1b1b",
        "surface-container-highest": "#353534",
        "on-tertiary-fixed": "#002109",
        "on-surface-variant": "#e4beb3",
        "surface-container-lowest": "#0e0e0e",
        "on-secondary": "#002e6a",
        "surface-variant": "#353534",
        "on-tertiary-container": "#003212",
        "on-secondary-container": "#e6ecff",
        "on-error": "#690005",
        "surface": "#131313",
        "surface-container": "#201f1f",
        "surface-container-high": "#2a2a2a",
        "error": "#ffb4ab",
        "primary-fixed-dim": "#ffb59e",
        "on-primary-container": "#541400",
        "secondary-container": "#0566d9",
        "error-container": "#93000a",
        "on-tertiary": "#003915",
        "tertiary-fixed-dim": "#4ae176",
        "surface-tint": "#ffb59e",
        "inverse-on-surface": "#313030",
        "on-primary-fixed-variant": "#852400",
        "on-primary-fixed": "#3a0b00",
        "outline": "#ab897f",
        "secondary-fixed": "#d8e2ff",
        "on-secondary-fixed": "#001a42",
        "surface-dim": "#131313",
        "secondary": "#adc6ff",
        "surface-bright": "#393939",
        "on-background": "#e5e2e1",
        "primary": "#ffb59e",
        "on-secondary-fixed-variant": "#004395",
        "inverse-surface": "#e5e2e1",
        "tertiary": "#4ae176",
        "tertiary-container": "#00a84c",
        "on-primary": "#5e1700",
        "on-error-container": "#ffdad6",
        "inverse-primary": "#ae3200",
        "on-surface": "#e5e2e1",
        "tertiary-fixed": "#6bff8f",
        "primary-fixed": "#ffdbd0",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin": "20px",
        "lg": "40px",
        "base": "8px",
        "sm": "12px",
        "xl": "64px",
        "xs": "4px",
        "md": "24px",
        "gutter": "16px"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        "h1": ["Inter", "sans-serif"],
        "body-md": ["Lexend", "sans-serif"],
        "body-lg": ["Lexend", "sans-serif"],
        "label-bold": ["Inter", "sans-serif"],
        "h3": ["Inter", "sans-serif"],
        "h2": ["Inter", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "lexend": ["Lexend", "sans-serif"]
      },
      fontSize: {
        "h1": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "900" }],
        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "label-bold": ["14px", { "lineHeight": "1", "fontWeight": "700" }],
        "h3": ["24px", { "lineHeight": "1.2", "fontWeight": "800" }],
        "h2": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "900" }]
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "xp-pop": "xpPop 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        "spin-in": "spinIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        xpPop: {
          "0%": { opacity: "0", transform: "scale(0.7) translateY(20px)" },
          "60%": { opacity: "1", transform: "scale(1.1) translateY(-5px)" },
          "100%": { transform: "scale(1) translateY(0)" },
        },
        spinIn: {
          "0%": { opacity: "0", transform: "rotate(-180deg) scale(0)" },
          "100%": { opacity: "1", transform: "rotate(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
