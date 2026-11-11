"use client";

import { useEffect } from "react";
import { applyTheme, getThemePreference } from "@/lib/theme";

// Follows the phone's light/dark switch while the preference is "system".
export default function ThemeWatcher() {
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => getThemePreference() === "system" && applyTheme("system");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return null;
}
