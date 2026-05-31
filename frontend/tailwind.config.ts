import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Фирменная шкала «amber» переопределена под золото/бронзу логотипа Liva.
        // Так весь дашборд/auth (классы amber-*) совпадает по тону с лендингом.
        amber: {
          50: "#F3F5F7",
          100: "#E8EBEF",
          200: "#D4D7DC",
          300: "#C0C4CB",
          400: "#A5A9B1",
          500: "#8A8E96",
          600: "#70747C",
          700: "#5A5E66",
          800: "#454850",
          900: "#33363D",
          950: "#12151C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
