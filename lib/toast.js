// Tiny event bus: any client component calls toast(), the <Toaster> in the root layout shows it.
const listeners = new Set();

export function toast(message, type = "ok") {
  const item = { id: `${Date.now()}-${Math.random()}`, message, type };
  listeners.forEach((listener) => listener(item));
}

export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
