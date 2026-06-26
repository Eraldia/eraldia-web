#!/usr/bin/env node
// ==========================================================================
// Envío de campañas de prospección por correo (Resend), con A/B testing.
//
// Cada campaña define una o varias VARIANTES de mensaje (A, B…), cada una con
// su asunto y su cuerpo. El script las reparte de forma equilibrada entre los
// destinatarios y registra qué variante recibió cada uno, para poder medir
// luego qué mensaje funciona mejor por sector. Además etiqueta cada envío en
// Resend (campaign + variant) para ver aperturas/clics por variante en el panel.
//
// Seguro por defecto:
//   - Sin --send: DRY RUN. Imprime lo que se enviaría, no envía nada.
//   - Con --send: envía SOLO las filas verified=yes que NO estén ya en el
//     registro de enviados (idempotente: cada dirección recibe un único correo).
//
// La clave de Resend se toma de RESEND_API_KEY o, si no está, de .dev.vars.
//
// Uso:
//   node tools/send-outreach.mjs --campaign=dentistas            # dry run
//   node tools/send-outreach.mjs --campaign=dentistas --send     # envía
//   node tools/send-outreach.mjs --campaign=fisios --send --to=tu@correo  # prueba
//
// Sin dependencias (Node >=18, usa fetch nativo).
// ==========================================================================

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Remitente (común a todas las campañas) ---------------------------------
const FROM = process.env.OUTREACH_FROM || 'Gorka Alapont — Eraldia <hola@eraldia.com>';
const REPLY_TO = 'hola@eraldia.com';

// Pie común para las campañas "largas" (climatización, asesorías).
const FOOTER = `Un saludo,
Gorka Alapont — Eraldia
Pon tu pyme al día con la IA
${REPLY_TO}

—
Si prefieres no recibir más correos míos, respóndeme con "baja" y no te escribo de nuevo.`;

const CLINICAS_LANDING = 'https://eraldia.com/casos/clinicas/';

// --- Variantes de mensaje para sectores de salud (A/B) ----------------------
// Ambas variantes cubren TODO el offering (citas, presupuestos/facturas y web);
// lo que cambia es el ángulo de entrada, el orden y el asunto, para medir cuál
// engancha mejor por sector. `who` = tipo de centro; `noun` = "pacientes"/"clientes".
//
// Variante A: entra por "ahorrar tiempo" (citas primero, luego dinero y web).
function healthA(who, landing, noun = 'pacientes') {
  return `Hola:

Soy Gorka, de Eraldia (Bilbao). Ayudo a ${who} a quitarse de encima el lío del día a día: recordatorios para que no se pierdan citas, presupuestos y facturas que salen al momento, y la web trabajando para traeros ${noun}.

Lo monto sencillo y a precio cerrado, empezando por lo que más os apriete. ¿Te llamo 10 minutos esta semana y lo vemos? Si no encaja, me lo dices y no insisto.

Por si quieres echar un ojo: ${landing}

Gorka
hola@eraldia.com`;
}
// Variante B: entra por "presupuestos y dinero" (luego citas y web).
function healthB(who, landing, noun = 'pacientes') {
  return `Hola:

Soy Gorka, de Eraldia (Bilbao). Ayudo a ${who} con lo que más se atasca: presupuestos que salen al momento y con seguimiento para que se cierren más, facturas sin picar a mano, los recordatorios para que la gente no falte y una web que os trae ${noun}.

Lo monto sencillo y a precio cerrado, empezando por lo que más os apriete. ¿Te llamo 10 minutos esta semana y lo vemos? Si no encaja, me lo dices y no insisto.

Por si quieres echar un ojo: ${landing}

Gorka
hola@eraldia.com`;
}

// Construye las dos variantes A/B de un sector de salud.
function healthVariants(who, noun = 'pacientes', place = 'la clínica') {
  return [
    { key: 'A', subject: `¿Qué es lo que más tiempo os quita en ${place}?`, render: (_r, l) => healthA(who, l, noun) },
    { key: 'B', subject: `Una forma de que ${place} os deje más tiempo (y dinero)`, render: (_r, l) => healthB(who, l, noun) },
  ];
}

// --- Definición de campañas -------------------------------------------------
const CAMPAIGNS = {
  climatizacion: {
    csv: 'outreach-climatizacion.csv',
    ledger: '.outreach-sent.json',
    log: '.outreach-climatizacion-log.csv',
    landing: 'https://eraldia.com/ia-para-climatizacion/',
    variants: [
      {
        key: 'A',
        subject: 'Con esta ola de calor, ¿se os escapan avisos y presupuestos?',
        render({ company, contact_name, custom_line }, landing) {
          const saludo = contact_name ? `Hola ${contact_name}:` : `Hola:`;
          const apertura = custom_line ? `${custom_line} ` : '';
          return `${saludo}

${apertura}Con la ola de calor de estos días imagino que en ${company} estáis a tope: entran más avisos de los que se pueden atender, los presupuestos se acumulan y la facturación queda para "cuando se pueda".

Soy Gorka, de Eraldia (Bilbao). Ayudo a pymes a quitarse ese papeleo con automatización e IA, con proyectos pequeños, de precio cerrado y sin humo. Para una empresa de climatización lo más útil suele ser:

- Que ningún aviso de WhatsApp o web se quede sin contestar ni agendar.
- Sacar presupuestos en una hora en lugar de en tres días (en verano, contestar primero = cerrar el trabajo).
- Generar las facturas a partir del presupuesto aceptado, sin picarlas a mano.

Lo he resumido en un caso práctico, paso a paso, aquí:
${landing}

Si te encaja, te invito a una llamada de 30 minutos, gratis y sin compromiso: te digo sin rodeos si esto te ahorra tiempo este verano y cuánto costaría. Y si no lo veo claro, también te lo digo.

${FOOTER}`;
        },
      },
    ],
  },

  asesorias: {
    csv: 'outreach-asesorias.csv',
    ledger: '.outreach-asesorias-sent.json',
    log: '.outreach-asesorias-log.csv',
    landing: 'https://eraldia.com/ia-para-asesorias/',
    variants: [
      {
        key: 'A',
        subject: '¿La campaña de la renta os deja sin horas para asesorar?',
        render({ company, contact_name, custom_line }, landing) {
          const saludo = contact_name ? `Hola ${contact_name}:` : `Hola:`;
          const apertura = custom_line ? `${custom_line} ` : '';
          return `${saludo}

${apertura}En plena recta final de la campaña de la renta imagino que en ${company} vais con la lengua fuera: picado de facturas, plazos que vigilar y las mismas consultas de siempre, una detrás de otra.

Soy Gorka, de Eraldia (Bilbao). Ayudo a asesorías y gestorías a quitarse de encima ese trabajo repetitivo con automatización e IA, con proyectos pequeños, de precio cerrado y sin humo. Lo que más libera suele ser:

- El procesado de facturas y nóminas, sin picarlas a mano.
- Los recordatorios de plazos y documentación a los clientes, automáticos.
- Las respuestas a las consultas repetitivas de siempre, por correo o WhatsApp.

Lo he resumido aquí, con ejemplos concretos para un despacho:
${landing}

Si te encaja, te invito a una llamada de 30 minutos, gratis y sin compromiso: te digo sin rodeos qué se puede automatizar en tu asesoría y cuánto costaría. Y si no lo veo claro, también te lo digo.

${FOOTER}`;
        },
      },
    ],
  },

  dentistas: {
    csv: 'outreach-dentistas.csv',
    ledger: '.outreach-dentistas-sent.json',
    log: '.outreach-dentistas-log.csv',
    landing: CLINICAS_LANDING,
    variants: healthVariants('clínicas dentales', 'pacientes'),
  },

  fisios: {
    csv: 'outreach-fisios.csv',
    ledger: '.outreach-fisios-sent.json',
    log: '.outreach-fisios-log.csv',
    landing: CLINICAS_LANDING,
    variants: healthVariants('clínicas de fisioterapia', 'pacientes'),
  },

  esteticas: {
    csv: 'outreach-esteticas.csv',
    ledger: '.outreach-esteticas-sent.json',
    log: '.outreach-esteticas-log.csv',
    landing: CLINICAS_LANDING,
    variants: healthVariants('clínicas de estética', 'clientes'),
  },

  nutricion: {
    csv: 'outreach-nutricion.csv',
    ledger: '.outreach-nutricion-sent.json',
    log: '.outreach-nutricion-log.csv',
    landing: CLINICAS_LANDING,
    variants: healthVariants('consultas de nutrición y dietética', 'pacientes', 'la consulta'),
  },
};

// --- Args -------------------------------------------------------------------
const args = process.argv.slice(2);
const SEND = args.includes('--send');
const overrideTo = (args.find((a) => a.startsWith('--to=')) || '').split('=')[1] || null;
const campaignName = (args.find((a) => a.startsWith('--campaign=')) || '').split('=')[1] || 'climatizacion';
const MAX = parseInt((args.find((a) => a.startsWith('--max=')) || '').split('=')[1], 10) || Infinity;

const campaign = CAMPAIGNS[campaignName];
if (!campaign) {
  console.error(`Campaña desconocida: "${campaignName}". Opciones: ${Object.keys(CAMPAIGNS).join(', ')}`);
  process.exit(1);
}

const CSV = join(__dirname, campaign.csv);
const LEDGER = join(__dirname, campaign.ledger);
const LOG = join(__dirname, campaign.log);
const LANDING = campaign.landing;
const VARIANTS = campaign.variants;

// --- Clave de Resend: env o .dev.vars ---------------------------------------
function loadApiKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  const devVars = join(ROOT, '.dev.vars');
  if (existsSync(devVars)) {
    const m = readFileSync(devVars, 'utf8').match(/^\s*RESEND_API_KEY\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

// --- Registro de enviados (idempotencia) ------------------------------------
function loadLedger() {
  if (!existsSync(LEDGER)) return new Set();
  try { return new Set(JSON.parse(readFileSync(LEDGER, 'utf8'))); }
  catch { return new Set(); }
}
function saveLedger(set) {
  writeFileSync(LEDGER, JSON.stringify([...set], null, 2) + '\n');
}

// --- Log de A/B: qué variante recibió cada dirección ------------------------
function appendLog(email, variantKey, subject) {
  if (!existsSync(LOG)) writeFileSync(LOG, 'date,email,variant,subject\n');
  const date = new Date().toISOString().slice(0, 10);
  appendFileSync(LOG, `${date},${email},${variantKey},"${subject.replace(/"/g, '""')}"\n`);
}

// --- CSV parser mínimo (soporta comillas) -----------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim() !== ''));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

// --- Envío con reintento ante rate-limit (429) ------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendWithRetry(to, subject, body, tags, apiKey, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, text: body, tags }),
    });
    if (res.ok) return true;
    const text = await res.text();
    if (res.status === 429 && i < attempts) {
      const wait = 1000 * i; // backoff: 1s, 2s, 3s
      console.log(`   ⏳ rate limit (429), reintento ${i}/${attempts - 1} en ${wait}ms`);
      await sleep(wait);
      continue;
    }
    console.log(`   error ${res.status}: ${text}`);
    return false;
  }
  return false;
}

// --- Main -------------------------------------------------------------------
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const apiKey = loadApiKey();
const willSend = SEND && !!apiKey;
const ledger = loadLedger();

console.log('='.repeat(72));
console.log(willSend ? '🚀 MODO ENVÍO (Resend)' : '🧪 DRY RUN — no se envía nada');
console.log(`Campaña:  ${campaignName}  ·  variantes A/B: ${VARIANTS.map((v) => v.key).join('/')}`);
console.log(`From:     ${FROM}`);
console.log(`Empresas: ${rows.length} en el CSV · ya enviados: ${ledger.size}`);
if (overrideTo) console.log(`Override: todo se enviaría a ${overrideTo} (modo prueba)`);
if (SEND && !apiKey) console.log('⚠  --send ignorado: no se encontró RESEND_API_KEY (ni en entorno ni en .dev.vars).');
console.log('='.repeat(72));

// El reparto A/B se equilibra usando el total ya enviado como semilla.
let vCounter = ledger.size;
let sent = 0, skipped = 0;
const byVariant = {};

for (const row of rows) {
  const to = overrideTo || row.email;
  const verified = row.verified.toLowerCase() === 'yes';
  const already = !overrideTo && ledger.has(to);
  const isCandidate = overrideTo ? true : (verified && !already);

  const variant = VARIANTS[vCounter % VARIANTS.length];
  if (isCandidate) vCounter++;
  const body = variant.render(row, LANDING);

  const flags = [verified ? '' : '⚠ unverified', already ? '✓ ya enviado' : ''].filter(Boolean).join(' ');
  console.log(`\n──── ${row.company}  →  ${to}  [${variant.key}] ${flags}`);
  if (!willSend) { console.log(`Asunto: ${variant.subject}`); console.log(body); skipped++; continue; }

  if (already) { console.log('   ⏭  saltada: ya estaba en el registro de enviados.'); skipped++; continue; }
  if (!overrideTo && !verified) { console.log('   ⏭  saltada: email sin verificar (verified=no).'); skipped++; continue; }
  if (sent >= MAX) { console.log('   ⏭  tope --max alcanzado, queda para la próxima ejecución.'); skipped++; continue; }

  const tags = [{ name: 'campaign', value: campaignName }, { name: 'variant', value: variant.key }];
  const ok = await sendWithRetry(to, variant.subject, body, tags, apiKey);
  if (ok) {
    console.log(`   ✅ enviado [${variant.key}]`);
    if (!overrideTo) { ledger.add(to); saveLedger(ledger); appendLog(to, variant.key, variant.subject); }
    byVariant[variant.key] = (byVariant[variant.key] || 0) + 1;
    sent++;
  } else {
    console.log('   ❌ no enviado tras reintentos');
    skipped++;
  }
  await sleep(300); // Resend: máx. 5 req/s. 300ms deja margen de sobra.
}

console.log('\n' + '='.repeat(72));
if (willSend) {
  const reparto = Object.entries(byVariant).map(([k, n]) => `${k}:${n}`).join(' · ') || '—';
  console.log(`Enviados: ${sent} (${reparto}) · Saltados: ${skipped}`);
} else {
  console.log(`Dry run: ${rows.length} renderizados, 0 enviados.`);
}
if (!willSend && SEND) console.log('No se envió: falta la clave de Resend. Ponla en .dev.vars o RESEND_API_KEY.');
if (!SEND) console.log('Para enviar de verdad: marca verified=yes en el CSV y ejecuta con --send.');
console.log('='.repeat(72));
