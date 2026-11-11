"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Spinner from "@/app/spinner";
import { Field, Section, Segmented, inputCls } from "@/app/form-kit";
import { authenticate } from "./actions";

export default function LoginForm() {
  const [mode, setMode] = useState("login");
  const [show, setShow] = useState(false);
  const [state, formAction, pending] = useActionState(authenticate, null);
  const confirmFailed = useSearchParams().get("error") === "confirmacion";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Segmented label="Modo" name="mode" options={[["login", "Iniciar sesión"], ["signup", "Crear cuenta"]]} value={mode} onChange={setMode} full />

      <Section footer={mode === "signup" ? "Te enviaremos un correo para confirmar la cuenta." : null}>
        <Field label="Correo">
          <input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className={inputCls} />
        </Field>
        <Field label="Contraseña" as="div">
          <input
            name="password"
            aria-label="Contraseña"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Mínimo 8 caracteres"
            className={inputCls}
          />
          <button
            type="button"
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={show}
            onClick={() => setShow((s) => !s)}
            className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition active:scale-90 active:bg-fill"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {!show && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </Field>
      </Section>

      <p aria-live="polite" className="min-h-5 px-4 text-sm font-medium">
        {state?.error && <span className="text-warn">{state.error}</span>}
        {state?.message && <span className="text-ok">{state.message}</span>}
        {!state && confirmFailed && <span className="text-warn">Ese enlace ya se usó o expiró. Si ya confirmaste tu cuenta, inicia sesión.</span>}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.3)] transition active:scale-[0.98] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {pending && <Spinner className="size-5" />}
        {pending ? "Un momento…" : mode === "signup" ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );
}
