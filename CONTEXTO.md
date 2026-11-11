# Subtrack (antes GastoApp): contexto del proyecto

Documento para darle contexto a un chat de Claude Code. Primero la idea del producto, después lo técnico y al final lo que quedó pendiente.

---

## 1. La idea

PWA personal de finanzas, pensada primero para el celular (Android) y con vista de escritorio. Sirve para:

1. **Gastos del mes:** con categorías propias, presupuesto por categoría, gastos fijos y variables, y pagos con fecha futura. Se puede copiar los gastos fijos del mes anterior.
2. **Internet compartido:** un plan dividido entre el usuario y otras personas. Esas personas son solo registros, no tienen cuenta. Se reparte en partes iguales o personalizadas y cada mes se marca quién pagó. Cuando el usuario marca su propia parte, se crea un gasto automático en la categoría Servicios.
3. **Videojuegos:** compras por tipo (Juego, DLC, Micropago, Suscripción) y plataforma (PS5, PC u Otra), un límite mensual, gráfico de los últimos 6 meses y lista de deseos con precio objetivo. Las compras pueden ser en **COP o USD**: se guarda el equivalente en pesos con la tasa del día.
4. **Ahorro:** el sueldo mensual nunca se muestra completo ni se guarda en claro. Ahorro = sueldo + ingresos extra − gastos, acumulado mes a mes desde el mes en que se registró el sueldo por primera vez. Los pagos con fecha futura no cuentan hasta su fecha.
5. **Tarjetas de crédito:** de cada tarjeta solo se guarda el nombre, el día de corte y el día de pago, nunca datos de la tarjeta. Al registrar un gasto se elige el medio de pago: débito o una tarjeta con N cuotas (de 1 a 48). La pantalla muestra cuánto se paga cada mes por tarjeta, las cuotas del mes, la deuda pendiente y el avance de cada compra en cuotas. Para el ahorro, cada cuota se descuenta cuando se paga, no el día de la compra.
6. **Resumen del año:** gasto total, promedio mensual, barras de los 12 meses y en qué categorías se va el dinero.
7. **Suscripciones:** solo para planear. Guardan el precio mensual y/o el del plan anual, en COP o USD. Muestran cuánto cuesta cada una al año, si conviene más el plan de 12 meses y cuánto se podría ahorrar en total. El cobro real se sigue registrando como gasto, así que no se cuenta dos veces.
8. **Notificaciones:** una campana con avisos:
   - pagos en los próximos 7 días;
   - pagos de tarjeta;
   - presupuestos superados;
   - límite de juegos superado;
   - personas que no han pagado el internet después de la fecha de pago.

   Los avisos tienen estado leído o nuevo, y la campana solo cuenta los nuevos. Además hay **recordatorios diarios por push y por correo**, cada uno con su interruptor en Ajustes y un botón de envío de prueba.
9. **Multiusuario:** cada cuenta tiene sus propios datos. Los montos y los textos sensibles se guardan **cifrados** en la base de datos.

**Estilo de diseño:**
- Apple/iOS: barra de navegación flotante en forma de cápsula con desenfoque (blur, sin efecto de vidrio).
- Modo claro y oscuro.
- Botones de acción grandes abajo, al alcance del pulgar.
- Modales de confirmación propios y toasts.
- Animaciones con GSAP: números que cuentan, barras que crecen, listas en cascada, filas que se cierran al borrar y un efecto "pop" al elegir.
- Skeletons mientras carga.
- Aviso para instalar la PWA.

---

## 2. Stack y servicios

| Pieza | Detalle |
|---|---|
| Framework | **Next.js 16.4.6** (App Router, `cacheComponents: true`, `proxy.js` en lugar de middleware), React 19.3 |
| Lenguaje | **Solo JavaScript, sin TypeScript** (decisión del usuario) |
| Estilos | Tailwind v4 (`@theme inline` con tokens CSS en `app/globals.css`) |
| Gestor de paquetes | **pnpm** (nunca npm) |
| Base de datos y auth | Supabase (Postgres + Auth + RLS), `@supabase/ssr` y `@supabase/supabase-js` |
| Validación | Zod v4 (`z.email`, `z.uuid`, `z.iso.date`) |
| Animación | GSAP + `@gsap/react` (`useGSAP`), respetando `prefers-reduced-motion` |
| Push | `web-push` (VAPID) |
| Correo | API REST de Resend (sin SDK) |
| Hosting | Vercel, región `gru1`, despliegue automático con cada push a `main` |
| Repo | `github.com/conradojuliosisnero/gastoapp` (público) |
| Producción | https://gastoapp-sooty.vercel.app |
| Supabase | proyecto `hrkbzenodqcjwqejdizp` (sa-east-1) |
| Vercel | proyecto `prj_zCQVUYu47sWat1YDBw3Cjo5O3dvD`, equipo `team_fFisq3ucAlMUZxOTJ1Nkrbm6` (plan Hobby) |

### Variables de entorno (Vercel, solo Production)

Las marcadas como **Sensitive** nunca se imprimen ni se pegan en el chat.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas).
- `ENCRYPTION_KEY`: Sensitive, 32 bytes, para AES-256-GCM.
- `SUPABASE_SECRET_KEY`: Sensitive, solo la usa el cron (service role).
- `RESEND_API_KEY`: Sensitive. Opcional: `EMAIL_FROM` cuando haya un dominio verificado.
- `VAPID_PUBLIC_KEY` (pública), `VAPID_PRIVATE_KEY` (Sensitive).
- `CRON_SECRET`: Sensitive. Vercel la envía como `Authorization: Bearer …` al cron.
- `VERCEL_PROJECT_PRODUCTION_URL`: la pone Vercel y se usa para armar enlaces absolutos.

---

## 3. Estructura

```
app/
  layout.js            # Inter, script de tema antes de pintar, Toaster, ThemeWatcher, registro del SW
  globals.css          # tokens de color claro/oscuro (bg, card, ink, muted, line, accent, primary, ok, warn, danger, credit…)
  form-kit.js          # kit de formularios: AmountHero, Section, Field, Segmented, SwitchField, ChoiceChips, FormError
  count-up.js, progress.js, confirm.js (useConfirm), toaster.js, spinner.js, install-card.js
  (app)/               # pantallas con header y navegación
    layout.js          # móvil: 1 columna + tab bar flotante; lg+: barra lateral fija y grillas de 2 columnas
    tab-bar.js         # 5 tabs (Inicio, Internet, Gastos, Juegos, Tarjetas) + botón +; en escritorio, sidebar con "Resumen del año"
    app-header.js      # avatar (va a /ajustes) + campana con el número de avisos nuevos
    template.js        # entrada GSAP de cada pantalla + cascada de las listas [data-stagger]
    inicio/ gastos/ internet/ juegos/ tarjetas/ anual/   # cada una con page.js y sus actions.js (server actions)
  (sheet)/             # formularios a pantalla completa, sin tab bar; en escritorio, panel centrado
    layout.js + fresh.js   # key = router.bfcacheId para que cada visita abra el formulario limpio
    sheet-header.js        # SheetHeader (Cancelar + título, sticky con blur) y SaveBar (CTA fijo abajo)
    gastos/nuevo, gastos/editar (mismo formulario), gastos/presupuesto, juegos/nuevo|limite|deseo,
    ahorro/sueldo|extra, internet/plan, tarjetas/tarjeta, suscripcion, ajustes, notificaciones
  api/cron/recordatorios/route.js   # cron diario: push + correo por usuario (cliente service role)
  login/, auth/callback/            # email + contraseña, confirmación por correo
lib/
  crypto.js      # encrypt/decrypt AES-256-GCM, formato "v1.<iv>.<tag>.<data>"
  money.js       # formatCOP, formatMoney(minor, currency), parseAmount, parseUSD (centavos), typingMoney, usdToCop, today() (Bogotá), monthRange
  fx.js          # tasa USD→COP de open.er-api.com con "use cache" + cacheLife("hours"); null si falla
  gastos.js      # categorías por defecto, summarize(), isUpcoming()
  categories.js  # getCategories(supabase, module, userId?): crea las categorías por defecto la primera vez
  ahorro.js      # computeSavings()
  internet.js    # computeShares(), dueDate()
  credit.js      # statementPeriod, paymentDate, installments() (reparto exacto, el residuo va a la 1.ª cuota)
  cards.js       # getCredit(): tarjetas + compras + todas las cuotas
  subscriptions.js # compare() mensual vs anual, totals()
  alerts.js      # getAlerts(supabase, userId?) + withReadState()
  reminders.js   # digest() para push/correo, isPushEndpoint() (lista de hosts permitidos contra SSRF), appUrl()
  push.js, email.js, motion.js (pop/collapse/restore/stagger), select-all.js (paginación de 1000 en 1000)
  supabase/server.js (await connection() antes de crear el cliente), supabase/admin.js (service role)
supabase/migrations/0001…0012   # todas aplicadas en producción
e2e/smoke.mjs (móvil 390px), e2e/desktop.mjs (1280px)   # Playwright contra producción
public/sw.js       # fallback offline, cache-first de /_next/static, handlers de push y notificationclick
```

### Modelo de datos

Todas las tablas tienen RLS "solo el dueño" y `user_id default auth.uid()`. Los campos `*_enc` van cifrados.

- `categories` (module: gastos|juegos, name, monthly_budget_enc, unique user+module+name)
- `transactions`: module, kind fijo|variable, occurred_on, amount_enc (**siempre en COP**), description_enc, category_id, platform, currency COP|USD, original_amount_enc (centavos USD), fx_rate, card_id, installments
- `incomes` (period, amount_enc, created_at), `extra_incomes`
- `internet_plans`, `internet_members` (name_enc, share_enc, is_me), `internet_payments` (period, transaction_id)
- `module_limits` (límite mensual de juegos), `wishlist` (currency y precios en su propia moneda)
- `credit_cards` (name_enc, cut_day, pay_day)
- `subscriptions` (name_enc, currency, monthly_enc, annual_enc, billing mensual|anual)
- `notification_prefs` (push, email), `push_subscriptions` (endpoint, keys_enc, unique user+endpoint), `notification_reads` (user_id, alert_id)
- Las FK compuestas `(id, user_id)` impiden relacionar filas de cuentas distintas.

### Reglas de dinero

- COP sin decimales.
- USD en centavos (enteros).
- Totales, ahorro y presupuestos se calculan siempre en COP.

---

## 4. Trampas conocidas de Next 16 (ya resueltas; no hay que repetirlas)

- **Supabase en el prerender:** llama `Date.now()`, así que `createClient()` hace `await connection()` primero.
- **Pantallas ocultas que siguen vivas:** con `cacheComponents` las pantallas visitadas quedan montadas y ocultas (`<Activity>`).
  - Las hojas usan `<Fresh>` (key `bfcacheId`).
  - Los formularios con datos sensibles (sueldo) limpian su estado al desmontarse.
  - No poner keys derivadas de datos que cambian con `refresh()`, porque reinician el formulario.
- **Refrescar después de guardar:** dentro de las server actions se usa `refresh()` de `next/cache`.
- **Imports de CommonJS:** `web-push` se importa con nombres (`import { sendNotification, setVapidDetails }`). El import por defecto rompe el build de Turbopack.
- **Build local sin internet:** `next/font/google` falla porque no puede descargar la fuente. Para compilar en local, reemplaza temporalmente el import de Inter en `app/layout.js` y restáuralo después.
- **Modo oscuro:** se controla con `data-theme` en `<html>`. La variante `dark:` de Tailwind no sirve aquí; usa los tokens de `globals.css`.

---

## 5. Cómo se trabaja en este repo

- `AGENTS.md` trae dos cosas: el aviso de Next 16 ("lee `node_modules/next/dist/docs/` antes de escribir código") y las reglas **ponytail**:
  - el cambio más pequeño que resuelva todo;
  - tests para la lógica de dinero y de seguridad;
  - comentarios `shortcut: <límite>, <cuándo mejorarlo>`;
  - terminar cada respuesta con lo que se omitió y los riesgos.
- Tests unitarios: `pnpm test` (node --test). Hoy son 29 y pasan todos.
- **Probar todo en producción antes de pedirle al usuario que pruebe** (regla del usuario):
  - e2e con Playwright en un Vercel Sandbox (iad1), con una cuenta de prueba nueva en cada corrida;
  - las cuentas `e2e-N@gastoapp.test` se crean con SQL en `auth.users` y `auth.identities`;
  - borrar datos de prueba con SQL requiere la aprobación del usuario.
- Commits:
  - autor `Claude <noreply@anthropic.com>`;
  - mensajes en español con prefijos feat/fix;
  - trailers `Co-Authored-By` y `Claude-Session`.
- Todo push a `main` despliega en producción.
- UI en español de Colombia. Fechas en la zona horaria de Bogotá (`today()`).

---

## 6. Estado y pendientes

**Hecho y en producción:**
- Gastos (con edición), internet, juegos (con USD), ahorro, tarjetas y cuotas, resumen anual y suscripciones.
- Notificaciones leídas/nuevas, recordatorios push y por correo con cron (`0 13 * * *` UTC, 8:00 a. m. en Bogotá).
- Kit de formularios, escritorio, microinteracciones, modo oscuro y PWA.

**En curso cuando se escribió este documento:**
1. **Renombrar la app a "Subtrack".** Hay que cambiar:
   - `app/layout.js` (title y appleWebApp);
   - `app/manifest.js`;
   - `app/login/page.js`;
   - `app/(app)/tab-bar.js` (marca del sidebar);
   - `app/install-card.js`;
   - `public/offline.html`;
   - `public/sw.js` (título por defecto del push);
   - `lib/reminders.js` y `lib/reminders.test.js`;
   - `lib/email.js` (remitente);
   - `app/(sheet)/ajustes/actions.js`;
   - `package.json`.

   El repo, el proyecto de Vercel y el dominio siguen como `gastoapp`, a menos que el usuario pida cambiarlos.
2. **Rediseñar la plantilla del correo y organizar mejor la información:**
   - qué hay: `getAlerts` ya devuelve, por cada aviso, `group` (pagos | presupuestos | internet), `name`, `meta` y `amount`. Este cambio ya está en `main` (`lib/alerts.js`).
   - qué falta: reescribir `digest()` en `lib/reminders.js` con HTML de correo basado en tablas y estilos inline:
     - encabezado con la marca y la fecha;
     - tarjeta de resumen con el total por pagar en 7 días;
     - secciones por grupo, con el monto alineado a la derecha;
     - botón "Abrir Subtrack";
     - pie con enlace a Ajustes para desactivar los correos;
     - texto de vista previa (preheader).
   - mantener la versión en texto plano y actualizar `lib/reminders.test.js`.
3. **Probar con el usuario:** el correo de prueba (sin dominio verificado, Resend solo entrega al correo dueño de la cuenta) y el push en Android.

**Atajos conocidos:**
- Las cuotas se calculan sin intereses.
- Una cuota se da por pagada cuando pasa su fecha; no hay botón para marcarla como pagada.
- `getCredit` no pagina más allá de 1000 compras.
- Inicio descifra todo el historial para calcular el ahorro.
- La tasa USD viene de una API pública diaria.

**Pendiente de decidir con el usuario:**
- Cambiar las llaves VAPID y `CRON_SECRET` (se generaron dentro del chat).
- Borrar las cuentas `e2e-1` a `e2e-10`.
- Activar la protección contra contraseñas filtradas (requiere el plan Pro de Supabase).
- Login con Google.
- IA local de Chrome (opcional).
