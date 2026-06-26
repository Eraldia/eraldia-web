#!/usr/bin/env node
// ==========================================================================
// Envío de campañas de prospección por correo (Resend).
//
// Soporta varias campañas (climatización, asesorías…). Se elige con
// --campaign=<nombre>; por defecto, "climatizacion" (la del hook postdeploy).
//
// Seguro por defecto:
//   - Sin --send: DRY RUN. Imprime lo que se enviaría, no envía nada.
//   - Con --send: envía SOLO las filas verified=yes del CSV de la campaña que
//     NO estén ya en su registro de enviados (idempotente: cada dirección
//     recibe el correo una sola vez, aunque se reejecute o se redespliegue).
//
// La clave de Resend se toma de RESEND_API_KEY o, si no está, de .dev.vars.
// El remitente por defecto es el dominio verificado en Resend.
//
// Uso:
//   node tools/send-outreach.mjs                              # dry run (climatización)
//   node tools/send-outreach.mjs --send                       # envía climatización
//   node tools/send-outreach.mjs --campaign=asesorias         # dry run asesorías
//   node tools/send-outreach.mjs --campaign=asesorias --send  # envía asesorías
//   node tools/send-outreach.mjs --send --to=tu@correo        # prueba: todo a tu correo
//
// Sin dependencias (Node >=18, usa fetch nativo).
// ==========================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Remitente (común a todas las campañas) ---------------------------------
const FROM = process.env.OUTREACH_FROM || 'Gorka Alapont — Eraldia <hola@eraldia.com>';
const REPLY_TO = 'hola@eraldia.com';

// Pie común: firma + línea de baja (RGPD/LSSI).
const FOOTER = `Un saludo,
Gorka Alapont — Eraldia
Pon tu pyme al día con la IA
${REPLY_TO}

—
Si prefieres no recibir más correos míos, respóndeme con "baja" y no te escribo de nuevo.`;

// --- Definición de campañas -------------------------------------------------
const CAMPAIGNS = {
  climatizacion: {
    csv: 'outreach-climatizacion.csv',
    ledger: '.outreach-sent.json',
    subject: 'Con esta ola de calor, ¿se os escapan avisos y presupuestos?',
    landing: 'https://eraldia.com/ia-para-climatizacion/',
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

  asesorias: {
    csv: 'outreach-asesorias.csv',
    ledger: '.outreach-asesorias-sent.json',
    subject: '¿La campaña de la renta os deja sin horas para asesorar?',
    landing: 'https://eraldia.com/ia-para-asesorias/',
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

  dentistas: {
    csv: 'outreach-dentistas.csv',
    ledger: '.outreach-dentistas-sent.json',
    subject: '¿Qué es lo que más tiempo os quita en la clínica?',
    landing: 'https://eraldia.com/casos/clinicas/',
    render(_row, landing) {
      return `Hola:

Soy Gorka, de Eraldia (Bilbao). Ayudo a clínicas dentales a quitarse de encima el lío del día a día: presupuestos y facturas que salgan en un momento, los recordatorios para que la gente no falte, y la web y los mensajes con los pacientes funcionando solos.

Lo monto sencillo y a precio cerrado, empezando por lo que más os apriete. ¿Te llamo 10 minutos esta semana y lo vemos? Si no encaja, me lo dices y no insisto.

Por si quieres echar un ojo: ${landing}

Gorka
hola@eraldia.com`;
    },
  },
};

// --- Args -------------------------------------------------------------------
const args = process.argv.slice(2);
const SEND = args.includes('--send');
const overrideTo = (args.find((a) => a.startsWith('--to=')) || '').split('=')[1] || null;
const campaignName = (args.find((a) => a.startsWith('--campaign=')) || '').split('=')[1] || 'climatizacion';

const campaign = CAMPAIGNS[campaignName];
if (!campaign) {
  console.error(`Campaña desconocida: "${campaignName}". Opciones: ${Object.keys(CAMPAIGNS).join(', ')}`);
  process.exit(1);
}

const CSV = join(__dirname, campaign.csv);
const LEDGER = join(__dirname, campaign.ledger);
const SUBJECT = campaign.subject;
const LANDING = campaign.landing;

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

async function sendWithRetry(to, body, apiKey, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject: SUBJECT, text: body }),
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
console.log(`Campaña:  ${campaignName}`);
console.log(`From:     ${FROM}`);
console.log(`Reply-To: ${REPLY_TO}`);
console.log(`Asunto:   ${SUBJECT}`);
console.log(`Empresas: ${rows.length} en el CSV · ya enviados: ${ledger.size}`);
if (overrideTo) console.log(`Override: todo se enviaría a ${overrideTo} (modo prueba)`);
if (SEND && !apiKey) console.log('⚠  --send ignorado: no se encontró RESEND_API_KEY (ni en entorno ni en .dev.vars).');
console.log('='.repeat(72));

let sent = 0, skipped = 0;
for (const row of rows) {
  const to = overrideTo || row.email;
  const verified = row.verified.toLowerCase() === 'yes';
  const already = !overrideTo && ledger.has(to);
  const body = campaign.render(row, LANDING);

  const flags = [verified ? '' : '⚠ unverified', already ? '✓ ya enviado' : ''].filter(Boolean).join(' ');
  console.log(`\n──── ${row.company}  →  ${to}  ${flags}`);
  if (!willSend) { console.log(body); skipped++; continue; }

  if (already) { console.log('   ⏭  saltada: ya estaba en el registro de enviados.'); skipped++; continue; }
  if (!overrideTo && !verified) { console.log('   ⏭  saltada: email sin verificar (verified=no).'); skipped++; continue; }

  const ok = await sendWithRetry(to, body, apiKey);
  if (ok) {
    console.log('   ✅ enviado');
    if (!overrideTo) { ledger.add(to); saveLedger(ledger); }
    sent++;
  } else {
    console.log('   ❌ no enviado tras reintentos');
    skipped++;
  }
  await sleep(300); // Resend: máx. 5 req/s. 300ms deja margen de sobra.
}

console.log('\n' + '='.repeat(72));
console.log(willSend ? `Enviados: ${sent} · Saltados: ${skipped}` : `Dry run: ${rows.length} renderizados, 0 enviados.`);
if (!willSend && SEND) console.log('No se envió: falta la clave de Resend. Ponla en .dev.vars o RESEND_API_KEY.');
if (!SEND) console.log('Para enviar de verdad: marca verified=yes en el CSV y ejecuta con --send.');
console.log('='.repeat(72));
