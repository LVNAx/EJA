import localFont from "next/font/local";

export const openDyslexic = localFont({
  src: [
    { path: "./fonts/OpenDyslexic-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenDyslexic-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  variable: "--font-open-dyslexic",
});
