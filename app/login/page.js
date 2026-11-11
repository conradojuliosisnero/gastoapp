import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "./login-form";

export const metadata = { title: "Entrar" };

const FEATURES = [
  ["Gastos y presupuestos", "Categorías, gastos fijos y pagos futuros, mes a mes.", <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6" /><path d="M9 12h6" /></>],
  ["Tarjetas y cuotas", "Cuánto pagas cada mes según el corte de cada tarjeta.", <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></>],
  ["Suscripciones", "Lo que te cuestan al año y si conviene el plan anual.", <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>],
  ["Recordatorios", "Avisos de pagos por push y correo cada mañana.", <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>],
];

const Icon = ({ children, className = "" }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export default function LoginPage() {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel: desktop only */}
      <section aria-label="Subtrack" className="relative hidden overflow-hidden bg-gradient-to-br from-[#0f5f58] via-[#0f766e] to-[#14907f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -top-32 -right-24 size-[420px] rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 size-[360px] rounded-full bg-[#2dd4bf]/25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Image src="/icons/icon-192.png" alt="" width={44} height={44} priority className="rounded-[12px] ring-1 ring-white/30" />
          <span className="font-display text-2xl font-semibold tracking-tight">Subtrack</span>
        </div>
        <div className="relative flex max-w-md flex-col gap-8">
          <h2 className="font-display text-[44px] leading-[1.05] font-semibold tracking-tight">Tu plata del mes, clara y en un solo lugar.</h2>
          <ul className="flex flex-col gap-5">
            {FEATURES.map(([title, text, icon]) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon>{icon}</Icon>
                </span>
                <span className="flex flex-col">
                  <span className="text-base font-semibold">{title}</span>
                  <span className="text-[15px] text-white/80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-[13px] text-white/75">
          <Icon className="size-4"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
          Tus montos y nombres se guardan cifrados.
        </p>
      </section>

      <div className="flex min-h-dvh flex-col justify-center px-4 py-10 lg:px-12">
        <div className="mx-auto flex w-full max-w-[400px] flex-col gap-8">
          <header className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <Image src="/icons/icon-192.png" alt="" width={64} height={64} priority className="rounded-[18px] shadow-[0_12px_30px_rgba(15,118,110,0.35)] lg:hidden" />
            <h1 className="font-display text-[32px] font-semibold tracking-tight">
              <span className="lg:hidden">Subtrack</span>
              <span className="hidden lg:inline">Bienvenido</span>
            </h1>
            <p className="text-[15px] text-muted">Gastos, tarjetas, suscripciones e internet compartido en un solo lugar.</p>
          </header>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="flex items-center justify-center gap-2 text-[13px] text-muted lg:hidden">
            <Icon className="size-4"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
            Tus montos y nombres se guardan cifrados.
          </p>
        </div>
      </div>
    </main>
  );
}
