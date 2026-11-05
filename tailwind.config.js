/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#27272a",
        background: "#09090b",
        surface: "#18181b",
        surfaceHover: "#27272a",
        foreground: "#f4f4f5",
        muted: "#a1a1aa",
        primary: "#2563eb",
        primaryHover: "#1d4ed8",
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#d97706",
      },
    },
  },
  plugins: [],
};

