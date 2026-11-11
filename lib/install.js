"use client";

import { useSyncExternalStore } from "react";

// Chrome fires `beforeinstallprompt` once, early. Catch it at module load so any screen can offer "Instalar" later.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

let snapshot = null;
function getSnapshot() {
  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const canPrompt = Boolean(deferredPrompt);
  if (!snapshot || snapshot.installed !== installed || snapshot.isIOS !== isIOS || snapshot.canPrompt !== canPrompt) {
    snapshot = { installed, isIOS, canPrompt };
  }
  return snapshot;
}

const subscribe = (listener) => (listeners.add(listener), () => listeners.delete(listener));

// null on the server and during hydration; { installed, isIOS, canPrompt } in the browser.
export function useInstallState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === "accepted";
}
