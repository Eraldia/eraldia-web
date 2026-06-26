# Loop diario de prospección (con A/B testing)

Sistema para captar clientes por email de forma automática, rotando **sectores**
y **zonas** por toda España, y midiendo qué mensaje funciona mejor en cada sector.

## Piezas

- **`tools/send-outreach.mjs`** — motor de envío (Resend). Una campaña por sector;
  cada campaña tiene **variantes A/B** (asunto + cuerpo distintos). Reparte A/B de
  forma equilibrada, deduplica con su registro y registra qué variante recibió cada
  uno. Etiqueta cada envío en Resend (`campaign`, `variant`) para ver aperturas/clics
  por variante en el panel.
- **`tools/outreach-<sector>.csv`** — lista de cada sector (`company,email,verified,
  contact_name,custom_line`). Solo se envía a `verified=yes`.
- **`tools/.outreach-<sector>-sent.json`** — registro de enviados (idempotencia).
  **Versionado** para que el loop no reenvíe aunque el contenedor se recicle.
- **`tools/.outreach-<sector>-log.csv`** — log A/B: `date,email,variant,subject`.
- **`tools/outreach-plan.json`** — rotación diaria: matriz `combos` de (sector, zona),
  un `index` que avanza cada día, `comboPerDay` y `maxPerDay` (tope de envíos/día
  para no quemar la cuota de Resend).

## Variantes A/B (sectores de salud)

- **A — "agenda":** ángulo de citas/ausencias y comunicación con pacientes.
  Asunto: *¿Os falla mucha gente a última hora?*
- **B — "dinero":** ángulo de presupuestos y facturación.
  Asunto: *¿Cuánto tiempo se os va en presupuestos y facturas?*

Ambas enlazan `/casos/clinicas/`. Para añadir/editar variantes, ver `healthVariants`
en `send-outreach.mjs`.

## Dos piezas que se reparten el trabajo

- **Envío fiable → GitHub Action** (`.github/workflows/outreach-daily.yml`): cada
  día envía los `verified=yes` pendientes de cada sector (con A/B y tope `--max`),
  y commitea de vuelta los registros para no reenviar. Es determinista, no necesita
  IA y persiste de verdad. Requiere el secreto `RESEND_API_KEY` y, por la regla de
  GitHub, **vivir en la rama por defecto (main)** para que el `schedule` dispare.
- **Búsqueda de nuevos emails → loop con IA** (cron de sesión de Claude): rota
  sector × zona, busca centros con email real, los añade al CSV con `verified=yes`
  y commitea. NO envía (de eso se encarga el Action).

## Qué hace el loop cada día

1. Lee `outreach-plan.json` y coge los próximos `comboPerDay` combos desde `index`.
2. Para cada combo (sector, zona): busca en la web centros de ese tipo con **email
   real publicado**, descartando cadenas/franquicias y los ya presentes en el CSV.
3. Los añade al `outreach-<sector>.csv` con `verified=yes`.
4. Avanza `index` (con wrap) y hace commit/push de plan + CSVs.
5. El **GitHub Action** los envía en su próxima tirada diaria (con A/B y `--max`).
   El loop también puede enviar a mano si hace falta:
   `node tools/send-outreach.mjs --campaign=<sector> --send --max=N`.

## Medir resultados

- **Panel de Resend → Emails**: filtra por etiqueta `variant=A` / `variant=B` y por
  `campaign=<sector>` para comparar entregas, aperturas y clics.
- **Respuestas**: llegan a `hola@eraldia.com`. Cruzar el remitente con el log A/B del
  sector dice qué variante generó la respuesta.

## Lanzar a mano un sector

```bash
node tools/send-outreach.mjs --campaign=fisios                 # dry run
RESEND_API_KEY=... node tools/send-outreach.mjs --campaign=fisios --send
```

## Calentamiento de IP/dominio (warm-up)

Mandar mucho de golpe desde un dominio nuevo dispara el rechazo (spam/rebotes).
Por eso el envío arranca bajo y sube poco a poco.

- **`tools/warmup.json`** — rampa: `start` (día que enciendes el envío) y `steps`
  con el cupo TOTAL de correos por día. Por defecto: 10 → 15 → 25 → 40 → 55 → 70
  a lo largo de ~4 semanas. Antes de `start`, el cupo es 0 (no se envía).
- **`tools/warmup-cap.mjs`** — calcula el cupo de hoy. El GitHub Action lo reparte
  entre los sectores y para al agotarlo.
- **IMPORTANTE:** pon `start` en `warmup.json` al **día real** en que mergeas a main
  y añades el secreto. Si lo dejas en el pasado, la rampa ya irá "adelantada".
- Para forzar un cupo puntual: *Run workflow* → `budget_override`.

### Higiene de entregabilidad (para que baje el rechazo)

1. **Autenticación del dominio** (lo más importante; se hace en el DNS de
   eraldia.com, panel de Resend → Domains): **SPF, DKIM y DMARC**. Empieza el
   DMARC en `p=none` y endurece cuando esté limpio.
2. **Rebotes bajos:** los emails de la cola son públicos y reales, pero alguno
   rebotará. Vigila en **Resend → Emails** y quita de los CSV los que reboten
   (bounce). Si el rebote pasa de ~3–4%, baja el cupo y limpia antes de seguir.
3. **Quejas bajas:** mantener el opt-out fácil (el mensaje ya invita a responder
   "no me interesa"). Si suben las quejas, parar y revisar copy/segmentación.
4. **Cadencia constante:** mejor 15/día todos los días que 100 un día y 0 cinco.
   La rampa + el cron diario ya lo hacen.
5. **Contenido sano:** texto plano, personal, sin imágenes pesadas ni muchos
   enlaces (el mensaje actual ya cumple).

> Aviso honesto: esto es prospección **en frío**, con engagement bajo por
> naturaleza. El warm-up + la higiene reducen el rechazo, pero no lo eliminan;
> la mejor señal es responder rápido a quien contesta y retirar a quien no.

## Cuota / rate limit

El script envía secuencialmente con 300 ms entre correos (~3/seg, por debajo del
límite de 5/seg de Resend) y reintenta con backoff ante un 429. El tope diario se
controla con `maxPerDay` en el plan, para no superar la cuota diaria de la cuenta.
