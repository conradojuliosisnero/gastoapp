import { createClient } from "@supabase/supabase-js";

// For the SubTrack extension: it signs in with Supabase itself and sends `Authorization: Bearer <access token>`.
// The client acts as that user, so RLS still scopes every query. Returns null when the token is missing or invalid.
export async function clientFromBearer(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub, email: data.claims.email };
}

export const unauthorized = () => Response.json({ error: "Sesión inválida o vencida. Vuelve a iniciar sesión." }, { status: 401 });
