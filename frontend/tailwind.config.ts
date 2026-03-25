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
        // ─── PRIMARY: Red instead of Blue ───────────────────────────────────
        "primary":                "#dc2626",
        "primary-dim":            "#b91c1c",
        "primary-container":      "#fee2e2",
        "on-primary":             "#fff7f7",
        "on-primary-container":   "#7f1d1d",
        "on-primary-fixed":       "#7f1d1d",
        "on-primary-fixed-variant":"#ef4444",
        "primary-fixed":          "#fee2e2",
        "primary-fixed-dim":      "#fecaca",
        "inverse-primary":        "#f87171",
        "surface-tint":           "#dc2626",

        // ─── Secondary ──────────────────────────────────────────────────────
        "secondary":              "#605f60",
        "secondary-dim":          "#545354",
        "secondary-container":    "#e5e2e3",
        "secondary-fixed":        "#e5e2e3",
        "secondary-fixed-dim":    "#d6d4d5",
        "on-secondary":           "#fbf8f9",
        "on-secondary-container": "#525152",
        "on-secondary-fixed":     "#403f40",
        "on-secondary-fixed-variant":"#5c5b5c",

        // ─── Tertiary (orange accent) ────────────────────────────────────────
        "tertiary":               "#9e4400",
        "tertiary-dim":           "#8b3b00",
        "tertiary-container":     "#f77113",
        "tertiary-fixed":         "#f77113",
        "tertiary-fixed-dim":     "#e56500",
        "on-tertiary":            "#fff7f5",
        "on-tertiary-container":  "#321000",
        "on-tertiary-fixed":      "#000000",
        "on-tertiary-fixed-variant":"#421800",

        // ─── Error ──────────────────────────────────────────────────────────
        "error":                  "#9e3f4e",
        "error-dim":              "#4f0116",
        "error-container":        "#ff8b9a",
        "on-error":               "#fff7f7",
        "on-error-container":     "#782232",

        // ─── Surface / Background ────────────────────────────────────────────
        "background":             "#f9f9fb",
        "on-background":          "#2d3338",
        "surface":                "#f9f9fb",
        "surface-bright":         "#f9f9fb",
        "surface-dim":            "#d3dbe2",
        "surface-variant":        "#dde3e9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low":  "#f2f4f6",
        "surface-container":      "#ebeef2",
        "surface-container-high": "#e4e9ee",
        "surface-container-highest":"#dde3e9",

        // ─── On-Surface ──────────────────────────────────────────────────────
        "on-surface":             "#2d3338",
        "on-surface-variant":     "#596065",

        // ─── Inverse ─────────────────────────────────────────────────────────
        "inverse-surface":        "#0c0e10",
        "inverse-on-surface":     "#9c9d9f",

        // ─── Outline ─────────────────────────────────────────────────────────
        "outline":                "#757c81",
        "outline-variant":        "#acb3b8",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        display:  ["Playfair Display", "serif"],
        serif:    ["Playfair Display", "serif"],
        playfair: ["Playfair Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm:      "0px",
        md:      "0px",
        lg:      "0px",
        xl:      "0px",
        "2xl":   "0px",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
