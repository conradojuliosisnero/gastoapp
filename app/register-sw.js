"use client";

import { useEffect } from "react";
import "@/lib/install"; // starts listening for the install prompt as early as possible

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
