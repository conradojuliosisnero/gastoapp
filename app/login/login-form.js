"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authenticate } from "./actions";

const MODES = [
  { id: "login", label: "Iniciar sesión" },
  { id: "signup", label: "Crear cuenta" },
];

export default function LoginForm() {
  const [mode, setMode] = useState("login");
  const [state, formAction, pending] = useActionState(authenticate, null);
  const confirmFailed = useSearchParams().get("error") === "confirmacion";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="mode" value={mode} />

      <div role="group" aria-label="Modo" className="grid grid-cols-2 gap-0.5 rounded-[10px] bg-segment p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className="min-h-9 rounded-lg text-sm font-semibold transition-colors aria-pressed:bg-card aria-pressed:shadow-sm"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-24 shrink-0 text-base">Correo</span>
          <input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-24 shrink-0 text-base">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Mínimo 8 caracteres"
            className="min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>
      </div>

      <p aria-live="polite" className="min-h-5 px-1 text-sm">
        {state?.error && <span className="text-warn">{state.error}</span>}
        {state?.message && <span className="text-ok">{state.message}</span>}
        {!state && confirmFailed && <span className="text-warn">Ese enlace ya se usó o expiró. Si ya confirmaste tu cuenta, inicia sesión.</span>}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-2xl bg-accent text-[17px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60"
      >
        {pending ? "Un momento…" : mode === "signup" ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );
}
