// Theme preference: "system" | "light" | "dark", stored per device.
const KEY = "theme";
const COLORS = { light: "#f2f2f7", dark: "#000000" };

export function resolveTheme(pref) {
  return pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}

export function getThemePreference() {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
}

export function applyTheme(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {}
  const theme = resolveTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COLORS[theme]));
  window.dispatchEvent(new Event("themechange"));
}

export function subscribeTheme(callback) {
  window.addEventListener("themechange", callback);
  return () => window.removeEventListener("themechange", callback);
}

// Runs inline in <head> before first paint, so there is no light flash in dark mode.
export const themeBootScript = `(()=>{try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
