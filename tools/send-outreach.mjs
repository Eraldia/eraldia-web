#!/usr/bin/env node
// ==========================================================================
// Envío de la campaña de prospección (climatización / ola de calor) vía Resend.
//
// Pensado para ejecutarse en el deploy a Cloudflare (hook `postdeploy` de
// package.json), pero seguro por defecto:
//
//   - Sin --send: DRY RUN. Imprime lo que se enviaría, no envía nada.
//   - Con --send: envía SOLO las filas marcadas verified=yes en el CSV
//     que NO estén ya en el registro de enviados (idempotente: cada dirección
//     recibe el correo una sola vez, aunque se redespliegue muchas veces).
//
// La clave de Resend se toma de RESEND_API_KEY o, si no está, de .dev.vars
// (el mismo fichero que usa `wrangler dev`). El remitente por defecto es el
// dominio verificado en Resend (LEAD_NOTIFY_FROM).
//
// Uso:
//   node tools/send-outreach.mjs                 # dry run
//   node tools/send-outreach.mjs --send          # envía verified=yes pendientes
//   node tools/send-outreach.mjs --to=tu@correo  # prueba: todo a tu correo
//
// Sin dependencias (Node >=18, usa fetch nativo).
// ==========================================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Config de la campaña ---------------------------------------------------
// Remitente: dominio verificado en Resend (mismo que el aviso de leads).
const FROM = process.env.OUTREACH_FROM || 'Gorka Alapont — Eraldia <hola@eraldia.com>';
const REPLY_TO = 'hola@eraldia.com';
const LANDING = 'https://eraldia.com/ia-para-climatizacion/';
const SUBJECT = 'Con esta ola de calor, ¿se os escapan avisos y presupuestos?';
const CSV = join(__dirname, 'outreach-climatizacion.csv');
const LEDGER = join(__dirname, '.outreach-sent.json'); // ignorado por git (.dev.vars* no, este sí hay que añadirlo)

// --- Args -------------------------------------------------------------------
const args = process.argv.slice(2);
const SEND = args.includes('--send');
const overrideTo = (args.find((a) => a.startsWith('--to=')) || '').split('=')[1] || null;

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

// --- Plantilla del email ----------------------------------------------------
function renderText({ company, contact_name, custom_line }) {
  const saludo = contact_name ? `Hola ${contact_name}:` : `Hola:`;
  const apertura = custom_line ? `${custom_line} ` : '';
  return `${saludo}

${apertura}Con la ola de calor de estos días imagino que en ${company} estáis a tope: entran más avisos de los que se pueden atender, los presupuestos se acumulan y la facturación queda para "cuando se pueda".

Soy Gorka, de Eraldia (Bilbao). Ayudo a pymes a quitarse ese papeleo con automatización e IA, con proyectos pequeños, de precio cerrado y sin humo. Para una empresa de climatización lo más útil suele ser:

- Que ningún aviso de WhatsApp o web se quede sin contestar ni agendar.
- Sacar presupuestos en una hora en lugar de en tres días (en verano, contestar primero = cerrar el trabajo).
- Generar las facturas a partir del presupuesto aceptado, sin picarlas a mano.

Lo he resumido en un caso práctico, paso a paso, aquí:
${LANDING}

Si te encaja, te invito a una llamada de 30 minutos, gratis y sin compromiso: te digo sin rodeos si esto te ahorra tiempo este verano y cuánto costaría. Y si no lo veo claro, también te lo digo.

Un saludo,
Gorka Alapont — Eraldia
Pon tu pyme al día con la IA
${REPLY_TO}

—
Si prefieres no recibir más correos míos, respóndeme con "baja" y no te escribo de nuevo.`;
}

// --- Main -------------------------------------------------------------------
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const apiKey = loadApiKey();
const willSend = SEND && !!apiKey;
const ledger = loadLedger();

console.log('='.repeat(72));
console.log(willSend ? '🚀 MODO ENVÍO (Resend)' : '🧪 DRY RUN — no se envía nada');
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
  const body = renderText(row);

  const flags = [verified ? '' : '⚠ unverified', already ? '✓ ya enviado' : ''].filter(Boolean).join(' ');
  console.log(`\n──── ${row.company}  →  ${to}  ${flags}`);
  if (!willSend) { console.log(body); skipped++; continue; }

  if (already) { console.log('   ⏭  saltada: ya estaba en el registro de enviados.'); skipped++; continue; }
  if (!overrideTo && !verified) { console.log('   ⏭  saltada: email sin verificar (verified=no).'); skipped++; continue; }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject: SUBJECT, text: body }),
  });
  if (res.ok) {
    console.log('   ✅ enviado');
    if (!overrideTo) { ledger.add(to); saveLedger(ledger); }
    sent++;
  } else {
    console.log(`   ❌ error ${res.status}: ${await res.text()}`);
    skipped++;
  }
}

console.log('\n' + '='.repeat(72));
console.log(willSend ? `Enviados: ${sent} · Saltados: ${skipped}` : `Dry run: ${rows.length} renderizados, 0 enviados.`);
if (!willSend && SEND) console.log('No se envió: falta la clave de Resend. Ponla en .dev.vars o RESEND_API_KEY.');
if (!SEND) console.log('Para enviar de verdad: marca verified=yes en el CSV y ejecuta con --send (o despliega con `npm run deploy`).');
console.log('='.repeat(72));
