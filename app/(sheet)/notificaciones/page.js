import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAlerts, withReadState } from "@/lib/alerts";
import AlertList from "./alert-list";
import { SheetHeader } from "../sheet-header";

export const metadata = { title: "Notificaciones" };

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const alerts = await withReadState(supabase, await getAlerts(supabase));

  return (
    <div className="flex flex-col gap-5">
      <SheetHeader title="Notificaciones" cancelHref="/inicio" cancelLabel="Volver" back />

      {alerts.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-center text-[15px] text-muted">Todo en orden. No tienes pagos en los próximos 7 días ni presupuestos excedidos.</p>
      ) : (
        <AlertList alerts={alerts} />
      )}

      <Link href="/ajustes" className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-line/70 transition active:bg-fill">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-semibold">Recibir avisos en el teléfono y por correo</span>
          <span className="text-[14px] text-muted">Actívalos en Ajustes › Recordatorios. Llegan cada mañana aunque no abras la app.</span>
        </span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="m9 6 6 6-6 6" /></svg>
      </Link>
    </div>
  );
}
