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
          100: "#F6EAD0",
          200: "#EFD9A9",
          300: "#E6C480",
          400: "#D9AE5C",
          500: "#CFA049",
          600: "#B9863A",
          700: "#A9742E",
          800: "#885B25",
          900: "#6E4A20",
          950: "#3F2912",
        },
      },
    },
  },
  plugins: [],
};
export default config;
