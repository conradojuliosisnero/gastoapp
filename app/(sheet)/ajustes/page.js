import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InstallCard from "@/app/install-card";
import { AppearancePicker, SignOutButton } from "./controls";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/inicio" className="flex min-h-11 items-center gap-0.5 justify-self-start text-[17px] text-accent transition active:opacity-60">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
          Inicio
        </Link>
        <h1 className="text-[17px] font-semibold">Ajustes</h1>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Apariencia</h2>
        <AppearancePicker />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">App</h2>
        <InstallCard variant="row" />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Cuenta</h2>
        <div className="overflow-hidden rounded-2xl bg-card">
          <p className="truncate px-4 py-3 text-base">{data?.claims?.email}</p>
          <div className="ml-4 h-px bg-line" />
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
