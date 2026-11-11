import { cacheLife } from "next/cache";

// shortcut: one public daily USD→COP rate (open.er-api.com, no key); switch to a paid feed if you need intraday rates.
async function fetchUsdRate() {
  "use cache";
  cacheLife("hours");
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  const rate = (await res.json())?.rates?.COP;
  if (!(rate > 1000 && rate < 20000)) throw new Error("Tasa USD→COP inválida");
  return rate;
}

// Null when the rate can't be fetched; failures are not cached.
export async function getUsdRate() {
  try {
    return await fetchUsdRate();
  } catch {
    return null;
  }
}
