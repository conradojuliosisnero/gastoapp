import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata = { title: "Inicio" };

export default async function InicioPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between px-1">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">{data?.claims?.email}</p>
          <h1 className="text-[34px] font-bold tracking-tight">Resumen</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="min-h-11 px-1 text-[15px] text-accent">Salir</button>
        </form>
      </header>
      <section className="rounded-[22px] bg-card p-5 text-[15px] text-muted">
        El resumen del mes aparece aquí cuando estén listos los módulos (Fase 6).
      </section>
    </div>
  );
}
