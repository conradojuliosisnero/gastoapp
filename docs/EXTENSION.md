# Conectar la extensión SubTrack con la PWA

Contexto para el chat de Claude Code que trabaja en la **extensión de navegador SubTrack**. La PWA (repo `conradojuliosisnero/gastoapp`, producción https://gastoapp-sooty.vercel.app) ya expone una API para la extensión. Este documento explica cómo conectarse.

## 1. La idea

- **Una cuenta y unos datos para las dos.** La extensión y la PWA usan la misma cuenta de usuario (Supabase Auth) y la misma tabla de suscripciones.
  - Lo que el usuario guarda en la extensión aparece en la PWA, en *Resumen del año › Suscripciones*, y al revés.
  - La PWA calcula el costo anual, si conviene el plan de 12 meses y la próxima renovación, y avisa de las renovaciones por campana, push y correo.
- **Qué hace cada una.** La extensión es la forma rápida de registrar una suscripción justo donde se compra (el sitio de Netflix, Google Play, PlayStation Store…). La PWA es el panel completo.
- **Fuente de verdad: la base de datos de la PWA.** La extensión no guarda una copia propia salvo como caché.

## 2. Por qué la extensión pasa por la API y no va directo a Supabase

Los montos y textos se guardan **cifrados con AES-256-GCM en el servidor de la PWA**, con `ENCRYPTION_KEY`. La extensión **nunca** debe tener esa llave. Por eso:

- **Autenticación:** la extensión inicia sesión **directamente con Supabase Auth**, que es seguro con la llave pública.
- **Datos:** lee y escribe **solo a través de la API de la PWA**, mandando el token de acceso. El servidor cifra, descifra, valida y aplica RLS como si fuera ese usuario.

## 3. Autenticación en la extensión

- Supabase URL: `https://hrkbzenodqcjwqejdizp.supabase.co`
- Llave pública (publishable): `sb_publishable_-t48d14S22N24iAfnKFHHg_BwTRx8FC`. Es pública y se puede incluir en el bundle.
- Las cuentas son de correo y contraseña. El usuario usa la misma que en la PWA. El registro también se puede hacer en la PWA.

```js
import { createClient } from "@supabase/supabase-js";

// chrome.storage.local como almacenamiento de la sesión (MV3 no tiene localStorage en el service worker)
const storage = {
  getItem: async (k) => (await chrome.storage.local.get(k))[k] ?? null,
  setItem: (k, v) => chrome.storage.local.set({ [k]: v }),
  removeItem: (k) => chrome.storage.local.remove(k),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

// login: await supabase.auth.signInWithPassword({ email, password })
// token para la API: (await supabase.auth.getSession()).data.session?.access_token
// logout: await supabase.auth.signOut()
```

- Si la API responde **401**, el token venció o es inválido. Intenta `supabase.auth.refreshSession()` una vez; si sigue fallando, muestra la pantalla de login.
- La extensión nunca guarda la contraseña, solo la sesión de Supabase.

### manifest.json (MV3)

```json
{
  "host_permissions": [
    "https://gastoapp-sooty.vercel.app/*",
    "https://hrkbzenodqcjwqejdizp.supabase.co/*"
  ],
  "permissions": ["storage"]
}
```

Con `host_permissions`, las llamadas desde el **popup o el service worker** no necesitan CORS. **No llames la API desde content scripts**: la API no envía cabeceras CORS. Si un content script detecta una compra, que le pase el mensaje al service worker (`chrome.runtime.sendMessage`).

## 4. API de la PWA

Base: `https://gastoapp-sooty.vercel.app/api/ext`. Todas las rutas requieren el encabezado `Authorization: Bearer <access_token de Supabase>`. El JSON va en UTF-8.

### Reglas de dinero (importante)

- Montos en **unidades mínimas y enteros**:
  - `COP` en pesos, sin decimales. Ejemplo: `26900` = $26.900.
  - `USD` en **centavos**. Ejemplo: `999` = US$9,99.
- `currency` es `"COP"` o `"USD"`.
- `billing` es `"mensual"` o `"anual"`. Indica cómo la paga hoy el usuario.

### Objeto suscripción (respuesta)

```json
{
  "id": "uuid",
  "name": "Netflix",
  "currency": "COP",
  "monthly": 26900,
  "annual": 269000,
  "billing": "mensual",
  "source": "netflix.com",
  "renewsOn": "2026-01-20",
  "cardId": "uuid | null",
  "updatedAt": "2026-11-11T13:50:00Z",
  "nextRenewal": "2026-11-20",
  "yearCost": 322800,
  "best": "anual",
  "saving": 53800,
  "pct": 17
}
```

Qué significa cada campo:

- `source`: dónde se compró, en texto libre de hasta 120 caracteres. Ejemplos: un dominio, "Google Play", "App Store".
- `renewsOn`: una fecha de renovación conocida (`YYYY-MM-DD`). Puede estar en el pasado: el servidor calcula `nextRenewal` sumando meses o años según `billing`.
- `cardId`: tarjeta de crédito a la que se cobra. Las tarjetas vienen en `GET`. La extensión no crea tarjetas; eso se hace en la PWA.
- Campos calculados (solo lectura):
  - `yearCost`: lo que cuesta al año con el plan actual.
  - `best`: el plan más barato al año (`"anual"`, `"mensual"`, o `null` si falta un precio para comparar).
  - `saving` y `pct`: la diferencia anual entre los dos planes, en monto y en porcentaje.

### Endpoints

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/ext/subscriptions` | — | `200 { today, usdRate, subscriptions: [...], cards: [{ id, name }] }` |
| POST | `/api/ext/subscriptions` | `{ name, currency, billing, monthly?, annual?, source?, renewsOn?, cardId? }` | `201 { subscription }` |
| PATCH | `/api/ext/subscriptions/:id` | solo los campos que cambian | `200 { subscription }` |
| DELETE | `/api/ext/subscriptions/:id` | — | `204` |

**Validación del servidor.** Si algo falla responde `400 { error }`, con un mensaje en español listo para mostrar.

- `name`: entre 1 y 40 caracteres.
- Precios: hace falta al menos uno, `monthly` o `annual`. Si `billing` es `"mensual"` se requiere `monthly`; si es `"anual"`, se requiere `annual`.

**Otros errores:**
- `401 { error }`: falta el token, es inválido o venció.
- `404`: no existe o es de otra cuenta.
- `500 { error }`: error del servidor.

`usdRate` es la tasa USD→COP del día (puede ser `null`). Sirve para mostrar el equivalente en pesos de las suscripciones en dólares.

### Ejemplo

```js
async function api(path, init = {}) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`https://gastoapp-sooty.vercel.app/api/ext/subscriptions${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error), { status: res.status });
  return json;
}

await api("", { method: "POST", body: JSON.stringify({ name: "Spotify", currency: "COP", monthly: 16900, billing: "mensual", source: "spotify.com", renewsOn: "2026-11-28" }) });
```

## 5. Qué hace la PWA con esos datos

- *Resumen del año › Suscripciones*: costo al año, el total al año y al mes, cuánto podría ahorrar con el plan más conveniente, dónde se compró y la fecha de renovación.
- **Avisos de renovación** desde 7 días antes:
  - en la campana de la PWA;
  - en el recordatorio diario por push y correo, si el usuario lo activó en Ajustes.

  Por eso la extensión **no necesita** sus propias alarmas de renovación, aunque puede tenerlas como extra.
- La suscripción es **para planear**. El cobro real se sigue registrando como gasto en la PWA, así que no se cuenta dos veces.

## 6. Diseño compartido

Usa la paleta de `app/globals.css` de la PWA, que es la misma de la extensión.

| Rol | Valor |
|---|---|
| Acento | `#0f766e` (oscuro `#0f5f58`, suave `#e3f4f1`) |
| Texto | `#16181d`, `#3a404b`, `#5b6270` |
| Líneas | `#e6e7e9` |
| Fondo | `#f4f4f2` |
| Tarjetas | `#ffffff` |
| ok | `#2f7d32` |
| warn | `#9a3412` |
| danger | `#b42318` |

- Modo oscuro de la PWA (por si la extensión lo agrega): fondo `#0b0d0e`, tarjetas `#17191c` y acento `#2dd4bf`.
- Tipografía: Inter para el texto; Space Grotesk 500/600 para títulos y números.

## 7. Límites actuales

- La API no tiene límite de peticiones. No hagas *polling* agresivo; basta con refrescar al abrir el popup.
- No hay sincronización en tiempo real. Si la extensión guarda una caché local, compárala con `updatedAt` al refrescar.
- La API solo cubre suscripciones (y lee las tarjetas). Gastos, internet y juegos se manejan en la PWA.
- El dominio sigue siendo `gastoapp-sooty.vercel.app`, aunque la app se llama Subtrack. Si cambia de dominio, hay que actualizar `host_permissions` y la URL base.
