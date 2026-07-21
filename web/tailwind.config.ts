import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        robin: "var(--color-robin)",
        ink: "#0A0A0F",
        panel: "#1A1A24",
        danger: "#FF4D6D",
        mint: "#00FFB2",
      },
      fontFamily: {
        pixel: ["'Press Start 2P'", "monospace"],
        body: ["'VT323'", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 #000",
        "pixel-sm": "2px 2px 0 #000",
        "pixel-robin": "4px 4px 0 var(--color-robin)",
      },
      keyframes: {
        "idle-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "idle-bounce": "idle-bounce 1.6s steps(2, jump-none) infinite",
        blink: "blink 1s steps(1) infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
