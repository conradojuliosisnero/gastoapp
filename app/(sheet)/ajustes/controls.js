"use client";

import { useSyncExternalStore, useTransition } from "react";
import { applyTheme, getThemePreference, subscribeTheme } from "@/lib/theme";
import { signOut } from "@/app/login/actions";
import { useConfirm } from "@/app/confirm";
import Spinner from "@/app/spinner";

const OPTIONS = [
  { id: "system", label: "Sistema" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];

export function AppearancePicker() {
  const pref = useSyncExternalStore(subscribeTheme, getThemePreference, () => null);

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-segment p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={pref === o.id}
          onClick={() => applyTheme(o.id)}
          className="min-h-10 rounded-[10px] text-sm font-semibold transition active:scale-95 aria-checked:bg-card aria-checked:shadow-sm"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SignOutButton() {
  const [confirm, dialog] = useConfirm();
  const [pending, startTransition] = useTransition();
  return (
    <>
      {dialog}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ title: "¿Cerrar sesión?", message: "Tendrás que volver a entrar con tu correo.", confirmLabel: "Cerrar sesión", destructive: true })) {
            startTransition(() => signOut());
          }
        }}
        className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-base text-danger active:bg-fill"
      >
        {pending && <Spinner />}
        Cerrar sesión
      </button>
    </>
  );
}
