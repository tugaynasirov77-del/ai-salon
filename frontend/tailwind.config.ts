import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Фирменная шкала «amber» переопределена под золото/бронзу логотипа Liva.
        // Так весь дашборд/auth (классы amber-*) совпадает по тону с лендингом.
        amber: {
          50: "#FBF6EC",
          100: "#F5E7C5",
          200: "#EED39B",
          300: "#E4BC74",
          400: "#D7A64C",
          500: "#CD9842",
          600: "#B7802F",
          700: "#A76823",
          800: "#84511B",
          900: "#6A4017",
          950: "#3C2410",
        },
      },
    },
  },
  plugins: [],
};
export default config;
