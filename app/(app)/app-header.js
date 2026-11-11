import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAlerts } from "@/lib/alerts";

const shell = "sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between lg:-mx-10 lg:mb-6 lg:flex-row-reverse lg:justify-start lg:gap-3 lg:px-10 lg:pt-5 border-b border-transparent bg-bg/80 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 lg:pt-5 backdrop-blur-xl backdrop-saturate-[1.8]";

const Bell = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
  </svg>
);

export function AppHeaderSkeleton() {
  return (
    <div className={shell} aria-hidden="true">
      <span className="size-10 animate-pulse rounded-full bg-line" />
      <span className="size-10 animate-pulse rounded-full bg-line" />
    </div>
  );
}

export default async function AppHeader() {
  const supabase = await createClient();
  const [{ data }, alerts] = await Promise.all([supabase.auth.getClaims(), getAlerts(supabase)]);
  const email = data?.claims?.email ?? "";
  const initials = email.split("@")[0].replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "?";
  const count = alerts.length;

  return (
    <header className={shell}>
      <Link
        href="/ajustes"
        aria-label="Perfil y ajustes"
        className="flex size-10 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white shadow-sm transition active:scale-90"
      >
        {initials}
      </Link>
      <Link
        href="/notificaciones"
        aria-label={count ? `Notificaciones, ${count} ${count === 1 ? "pendiente" : "pendientes"}` : "Notificaciones"}
        className="relative flex size-10 items-center justify-center rounded-full bg-card text-ink-2 shadow-sm transition active:scale-90"
      >
        <Bell />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-bg">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </header>
  );
}
