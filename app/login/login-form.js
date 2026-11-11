"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Spinner from "@/app/spinner";
import { Segmented } from "@/app/form-kit";
import { authenticate } from "./actions";

const fieldCls =
  "min-h-[52px] w-full rounded-2xl border border-line bg-card px-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15";

export default function LoginForm() {
  const [mode, setMode] = useState("login");
  const [show, setShow] = useState(false);
  const [state, formAction, pending] = useActionState(authenticate, null);
  const confirmFailed = useSearchParams().get("error") === "confirmacion";
  const signup = mode === "signup";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Segmented label="Modo" name="mode" options={[["login", "Iniciar sesión"], ["signup", "Crear cuenta"]]} value={mode} onChange={setMode} full />

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-[13px] font-semibold text-ink-2">Correo</span>
          <input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className={fieldCls} />
        </label>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="px-1 text-[13px] font-semibold text-ink-2">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="Mínimo 8 caracteres"
              className={`${fieldCls} pr-12`}
            />
            <button
              type="button"
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={show}
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 right-1 my-auto flex size-11 items-center justify-center rounded-xl text-muted transition hover:text-ink active:scale-90"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {!show && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </div>
          {signup && <span className="px-1 text-[13px] text-muted">Te enviaremos un correo para confirmar la cuenta.</span>}
        </div>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {state?.error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
        {state?.message && <p className="rounded-xl bg-ok/10 px-4 py-3 text-sm font-medium text-ok">{state.message}</p>}
        {!state && confirmFailed && <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm font-medium text-warn">Ese enlace ya se usó o expiró. Si ya confirmaste tu cuenta, inicia sesión.</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-semibold text-white shadow-[0_10px_24px_rgba(15,118,110,0.32)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {pending && <Spinner className="size-5" />}
        {pending ? "Un momento…" : signup ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );
}
