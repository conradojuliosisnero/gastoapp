"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function authenticate(_prevState, formData) {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  if (formData.get("mode") === "signup") {
    const origin = (await headers()).get("origin");
    const { error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return { error: "No pudimos crear la cuenta. Intenta con otro correo." };
    return { message: "Te enviamos un correo para confirmar tu cuenta." };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") return { error: "Primero confirma tu cuenta con el enlace que te enviamos al correo." };
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/inicio");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
