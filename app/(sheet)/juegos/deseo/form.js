"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createWish } from "@/app/(app)/juegos/actions";
import { parseAmount } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";

const group = new Intl.NumberFormat("es-CO");
const money = (v) => {
  const n = parseAmount(v);
  return n == null ? "" : `$${group.format(n)}`;
};

export default function WishForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState("PS5");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await createWish(prev, formData);
    if (result.ok) {
      toast("Agregado a tu lista de deseos");
      router.push("/juegos");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <SheetHeader title="Lista de deseos" cancelHref="/juegos" />
      <input type="hidden" name="platform" value={platform} />
      <div className="overflow-hidden rounded-2xl bg-card">
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-32 shrink-0 text-base">Juego</span>
          <input name="title" required autoFocus maxLength={80} placeholder="Ej. Juego de fútbol 2027" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <div className="flex min-h-12 items-center justify-between gap-3 px-4">
          <span id="wish-platform" className="text-base">Plataforma</span>
          <div role="radiogroup" aria-labelledby="wish-platform" className="grid grid-cols-3 gap-0.5 rounded-[10px] bg-segment p-0.5">
            {["PS5", "PC", "Otra"].map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={platform === p}
                onClick={() => setPlatform(p)}
                className="min-h-8 rounded-lg px-3 text-[13px] font-semibold transition active:scale-95 aria-checked:bg-card aria-checked:shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-32 shrink-0 text-base">Precio actual</span>
          <input name="current" inputMode="numeric" required placeholder="$0" value={current} onChange={(e) => setCurrent(money(e.target.value))} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        </label>
        <div className="ml-4 h-px bg-line" />
        <label className="flex min-h-12 items-center gap-3 px-4">
          <span className="w-32 shrink-0 text-base">Lo compro a</span>
          <input name="target" inputMode="numeric" placeholder="Opcional" value={target} onChange={(e) => setTarget(money(e.target.value))} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        </label>
      </div>
      <p aria-live="polite" className="min-h-5 px-1 text-sm text-danger">{state?.error}</p>
      <SaveBar pending={pending} label="Agregar a la lista" />
    </form>
  );
}
