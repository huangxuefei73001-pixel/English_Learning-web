import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5EFE4",
        text: "#191813",
        muted: "#625B4F",
        primary: "#55653A",
        deep: "#1A1815",
        soft: "#E8DDC7",
        line: "#D9D1BF",
        card: "#FFFCF5",
        accent: "#F1E8D7",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(63, 57, 36, 0.08)",
        lift: "0 12px 30px rgba(63, 57, 36, 0.12)",
      },
      fontFamily: {
        sans: [
          '"Avenir Next"',
          '"Segoe UI"',
          "PingFang SC",
          "Hiragino Sans GB",
          "Noto Sans CJK SC",
          "Microsoft YaHei",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          '"Baskerville"',
          '"Iowan Old Style"',
          "Georgia",
          "Songti SC",
          "STSong",
          "Noto Serif SC",
          "serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
