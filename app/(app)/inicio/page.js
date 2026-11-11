import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InstallCard from "@/app/install-card";

export const metadata = { title: "Inicio" };

export default async function InicioPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between px-1">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-muted">{data?.claims?.email}</p>
          <h1 className="text-[34px] font-bold tracking-tight">Resumen</h1>
        </div>
        <Link href="/ajustes" aria-label="Ajustes" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-ink-2 transition active:scale-90">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </header>
      <InstallCard />
      <section className="rounded-[22px] bg-card p-5 text-[15px] text-muted">
        El resumen del mes aparece aquí cuando estén listos los módulos (Fase 6).
      </section>
    </div>
  );
}
