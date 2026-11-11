"use client";

import { useState } from "react";
import Image from "next/image";
import { promptInstall, useInstallState } from "@/lib/install";
import { toast } from "@/lib/toast";

const DISMISS_KEY = "install-dismissed";

const ShareIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5">
    <path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 12v7h14v-7" />
  </svg>
);

// variant "banner": dismissible card on Inicio. variant "row": always-present row in Ajustes.
export default function InstallCard({ variant = "banner" }) {
  const state = useInstallState();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!state) return null;
  const banner = variant === "banner";
  if (banner && (state.installed || dismissed || (!state.canPrompt && !state.isIOS))) return null;

  async function install() {
    if (await promptInstall()) toast("App instalada");
  }

  let body;
  if (state.installed) body = <p className="text-[15px] text-muted">Ya estás usando la app instalada.</p>;
  else if (state.canPrompt)
    body = (
      <button type="button" onClick={install} className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-[15px] font-semibold text-white transition active:scale-[0.98]">
        Instalar Subtrack
      </button>
    );
  else if (state.isIOS)
    body = (
      <p className="text-[15px] text-muted">
        En Safari toca <ShareIcon /> <b className="font-semibold text-ink">Compartir</b> y luego <b className="font-semibold text-ink">Agregar a inicio</b>.
      </p>
    );
  else body = <p className="text-[15px] text-muted">Abre el menú del navegador y elige <b className="font-semibold text-ink">Instalar app</b> o <b className="font-semibold text-ink">Agregar a pantalla principal</b>.</p>;

  return (
    <section aria-label="Instalar la app" className="flex flex-col gap-3 rounded-[22px] bg-card p-4">
      <div className="flex items-start gap-3">
        <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-[12px]" />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-semibold">Instala Subtrack</span>
          <span className="text-[13px] text-muted">Ábrela desde tu pantalla de inicio, a pantalla completa y sin conexión.</span>
        </div>
        {banner && (
          <button
            type="button"
            aria-label="Ahora no"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {}
              setDismissed(true);
            }}
            className="-mt-1 -mr-1 flex size-9 items-center justify-center rounded-full text-muted active:bg-fill"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        )}
      </div>
      {body}
    </section>
  );
}
