import type { Config } from "tailwindcss";
import launcher from "./launcher.config.json";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        panel: "#12121A",
        primary: launcher.themeColor,
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        vt: ['"VT323"', "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 0 #000",
        "pixel-primary": `4px 4px 0 0 ${launcher.themeColor}`,
      },
    },
  },
  plugins: [],
};

export default config;
