import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-outfit)", "system-ui", "sans-serif"] },
      colors: {
        ink: "#1E0A45",
        accent: { 50: "#FFF1EA", 100: "#FFE3D6", 300: "#FFB596", 500: "#FF8C61", 600: "#F5723F" },
        brand: { 50: "#FAF5FF", 100: "#F3E8FF", 200: "#E9D5FF", 300: "#D8B4FE", 400: "#C084FC", 500: "#A855F7", 600: "#9333EA", 700: "#7E22CE", 900: "#3B0764" },
        success: { DEFAULT: "#34D399", 50: "#ECFDF5", 700: "#047857" },
      },
      borderRadius: { card: "24px" },
      keyframes: {
        blobA: { "0%,100%": { transform: "translate(-10%,-6%) scale(1)" }, "50%": { transform: "translate(8%,10%) scale(1.15)" } },
        blobB: { "0%,100%": { transform: "translate(10%,4%) scale(1.1)" }, "50%": { transform: "translate(-8%,-8%) scale(0.95)" } },
        blobC: { "0%,100%": { transform: "translate(0,8%) scale(1)" }, "50%": { transform: "translate(6%,-10%) scale(1.2)" } },
      },
      animation: { blobA: "blobA 18s ease-in-out infinite", blobB: "blobB 22s ease-in-out infinite", blobC: "blobC 26s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
