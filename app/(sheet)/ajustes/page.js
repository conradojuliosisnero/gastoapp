import { createClient } from "@/lib/supabase/server";
import { pushConfigured } from "@/lib/push";
import { emailConfigured } from "@/lib/email";
import InstallCard from "@/app/install-card";
import { Section } from "@/app/form-kit";
import { SheetHeader } from "../sheet-header";
import { AppearancePicker, SignOutButton } from "./controls";
import Reminders from "./reminders";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const supabase = await createClient();
  const [{ data }, { data: prefs }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("notification_prefs").select("email").maybeSingle(),
  ]);
  const email = data?.claims?.email ?? "";

  return (
    <div className="flex flex-col gap-6">
      <SheetHeader title="Ajustes" cancelHref="/inicio" cancelLabel="Inicio" back />

      <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-line/70">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
          {email.split("@")[0].replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "?"}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] text-muted">Tu cuenta</span>
          <span className="truncate text-base font-semibold">{email}</span>
        </span>
      </div>

      <Reminders
        vapidKey={process.env.VAPID_PUBLIC_KEY ?? ""}
        pushReady={pushConfigured()}
        emailReady={emailConfigured()}
        emailOn={Boolean(prefs?.email)}
        address={email}
      />

      <Section title="Apariencia" className="p-2">
        <AppearancePicker />
      </Section>

      <section className="flex flex-col gap-1.5">
        <h2 className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted">App</h2>
        <InstallCard variant="row" />
      </section>

      <Section>
        <SignOutButton />
      </Section>
    </div>
  );
}
