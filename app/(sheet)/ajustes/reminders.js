"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import Spinner from "@/app/spinner";
import { Section, SwitchField } from "@/app/form-kit";
import { sendTestEmail, sendTestPush, setEmailReminders, subscribePush, unsubscribePush } from "./actions";

const key = (base64) => {
  const s = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

// Why push can't work here, or null when it can. iPhone only allows push in the installed app.
function pushBlocker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return ios ? "En iPhone, primero instala la app (Compartir › Agregar a inicio) y ábrela desde ahí." : "Este navegador no permite notificaciones push.";
  }
  if (Notification.permission === "denied") return "Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.";
  return null;
}

function TestButton({ onTest, label }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(onTest)}
      className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[15px] font-semibold text-accent transition active:bg-fill disabled:opacity-60"
    >
      {pending && <Spinner />}
      {label}
    </button>
  );
}

export default function Reminders({ vapidKey, pushReady, emailReady, emailOn: initialEmail, address }) {
  const [device, setDevice] = useState(undefined); // undefined while checking; null when this device isn't subscribed
  const [blocker, setBlocker] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [busy, start] = useTransition();

  useEffect(() => {
    const why = pushBlocker();
    setBlocker(why);
    if (why) return setDevice(null);
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then(setDevice, () => setDevice(null));
  }, []);

  function togglePush(on) {
    start(async () => {
      if (!on) {
        await device?.unsubscribe();
        const result = await unsubscribePush(device?.endpoint);
        if (result.error) return toast(result.error, "error");
        setDevice(null);
        return toast("Notificaciones desactivadas en este dispositivo");
      }
      if ((await Notification.requestPermission()) !== "granted") {
        setBlocker(pushBlocker());
        return toast("Sin permiso no podemos enviarte notificaciones", "error");
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(vapidKey) });
        const result = await subscribePush(sub.toJSON());
        if (result.error) {
          await sub.unsubscribe();
          return toast(result.error, "error");
        }
        setDevice(sub);
        toast("Notificaciones activadas");
      } catch {
        toast("No se pudo activar en este dispositivo", "error");
      }
    });
  }

  function toggleEmail(on) {
    setEmail(on);
    start(async () => {
      const result = await setEmailReminders(on);
      if (result.error) {
        setEmail(!on);
        return toast(result.error, "error");
      }
      toast(on ? "Recordatorios por correo activados" : "Recordatorios por correo desactivados");
    });
  }

  async function test(action, done) {
    const result = await action();
    result.error ? toast(result.error, "error") : toast(done(result));
  }

  return (
    <Section
      title="Recordatorios"
      footer="Cada día a las 8:00 a. m. te avisamos de pagos en los próximos 7 días, presupuestos superados y quién falta por pagar el internet. Solo si hay algo que contar."
    >
      <SwitchField
        label="Notificaciones push"
        hint={!pushReady ? "Aún no configuradas en el servidor" : blocker ?? (device ? "Activas en este dispositivo" : "En este dispositivo")}
        checked={Boolean(device)}
        disabled={busy || !pushReady || Boolean(blocker) || device === undefined}
        onChange={(e) => togglePush(e.target.checked)}
      />
      {device && <TestButton label="Enviar notificación de prueba" onTest={() => test(sendTestPush, () => "Notificación enviada")} />}
      <SwitchField
        label="Correo"
        hint={emailReady ? address : "Aún no configurado en el servidor"}
        checked={email}
        disabled={busy || !emailReady}
        onChange={(e) => toggleEmail(e.target.checked)}
      />
      {email && emailReady && <TestButton label="Enviar correo de prueba" onTest={() => test(sendTestEmail, (r) => `Correo enviado a ${r.to}`)} />}
      {busy && <span className="sr-only" role="status">Guardando…</span>}
    </Section>
  );
}
