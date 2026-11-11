"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveGamesLimit } from "@/app/(app)/juegos/actions";
import { typingMoney } from "@/lib/money";
import { toast } from "@/lib/toast";
import { SaveBar, SheetHeader } from "../../sheet-header";
import { AmountHero, FormError } from "@/app/form-kit";

export default function LimitForm({ current }) {
  const router = useRouter();
  const [amount, setAmount] = useState(current ? typingMoney(String(current)) : "");
  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const result = await saveGamesLimit(prev, formData);
    if (result.ok) {
      toast(result.cleared ? "Límite quitado" : "Límite guardado");
      router.push("/juegos");
    } else {
      toast(result.error, "error");
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <SheetHeader title="Límite mensual" cancelHref="/juegos" />
      <AmountHero
        label="Máximo al mes en juegos"
        value={amount}
        onValue={setAmount}
        placeholder="Sin límite"
        hint="Te avisamos cuando lo pases. Las compras en dólares cuentan por su valor en pesos."
        autoFocus
      />
      {current ? (
        <button type="button" onClick={() => setAmount("")} className="min-h-11 self-center rounded-full px-4 text-[15px] font-semibold text-danger transition active:scale-95 active:bg-danger/10">
          Quitar el límite
        </button>
      ) : null}
      <FormError error={state?.error} />
      <SaveBar pending={pending} label={amount ? "Guardar límite" : current ? "Guardar sin límite" : "Guardar límite"} />
    </form>
  );
}
