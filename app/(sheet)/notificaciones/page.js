import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAlerts } from "@/lib/alerts";

export const metadata = { title: "Notificaciones" };

const ICONS = {
  pago: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  presupuesto: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
};

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const alerts = await getAlerts(supabase);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/inicio" className="flex min-h-11 items-center gap-0.5 justify-self-start text-[17px] text-accent transition active:opacity-60">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
          Volver
        </Link>
        <h1 className="text-[17px] font-semibold">Notificaciones</h1>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-8 text-center text-[15px] text-muted">Todo en orden. No tienes pagos en los próximos 7 días ni presupuestos excedidos.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-card">
          {alerts.map((a) => (
            <li key={a.id} className="border-t border-line first:border-t-0">
              <Link href={a.href} className="flex items-start gap-3 px-4 py-3 active:bg-fill">
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${a.kind === "presupuesto" ? "bg-warn/15 text-warn" : "bg-accent/12 text-accent"}`}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[a.kind]}</svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-semibold">{a.title}</span>
                  <span className="text-[14px] text-muted">{a.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-1 rounded-2xl bg-card p-4">
        <h2 className="text-base font-semibold">Avisos en el teléfono</h2>
        <p className="text-[14px] text-muted">
          Pronto podrás recibir estos avisos como notificación push y por correo, aunque no tengas la app abierta (fase de recordatorios).
        </p>
      </section>
    </div>
  );
}
