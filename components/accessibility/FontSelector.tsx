"use client";

import { useEffect } from "react";
import {
  setFontPreference,
  useFontPreference,
} from "@/lib/accessibility/font-preference";

export function FontPreferenceSync() {
  const font = useFontPreference();
  useEffect(() => {
    document.documentElement.dataset.readingFont = font;
  }, [font]);
  return null;
}

export function FontSelector() {
  const font = useFontPreference();
  return (
    <label className="font-selector">
      <span className="sr-only">Jenis huruf</span>
      <select
        aria-label="Jenis huruf"
        value={font}
        onChange={(event) =>
          setFontPreference(
            event.target.value === "opendyslexic" ? "opendyslexic" : "standard",
          )
        }
      >
        <option value="standard">Font biasa</option>
        <option value="opendyslexic">OpenDyslexic</option>
      </select>
    </label>
  );
}
