#!/usr/bin/env node
// ==========================================================================
// Envío de la campaña de prospección (climatización / ola de calor) vía Resend.
//
// SEGURO POR DEFECTO: sin argumentos hace DRY RUN (no envía nada, solo imprime
// lo que se enviaría). Para enviar de verdad hace falta, todo a la vez:
//   - RESEND_API_KEY en el entorno
//   - la bandera --send
//   - que cada fila esté marcada como verified=yes en el CSV
//
// Uso:
//   node tools/send-outreach.mjs                 # dry run (recomendado)
//   node tools/send-outreach.mjs --send          # envía SOLO filas verified=yes
//   node tools/send-outreach.mjs --to=tu@correo  # prueba: manda todo a tu correo
//
// Sin dependencias (Node >=18, usa fetch nativo).
// ==========================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config de la campaña ---------------------------------------------------
const FROM = process.env.OUTREACH_FROM || 'Gorka Alapont <onboarding@resend.dev>';
const REPLY_TO = 'hola@eraldia.com';
const LANDING = 'https://eraldia.com/ia-para-climatizacion/';
const SUBJECT = 'Con esta ola de calor, ¿se os escapan avisos y presupuestos?';
const CSV = join(__dirname, 'outreach-climatizacion.csv');

// --- Args -------------------------------------------------------------------
const args = process.argv.slice(2);
const SEND = args.includes('--send');
const overrideTo = (args.find((a) => a.startsWith('--to=')) || '').split('=')[1] || null;

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
const apiKey = process.env.RESEND_API_KEY;
const willSend = SEND && !!apiKey;

console.log('='.repeat(72));
console.log(willSend ? '🚀 MODO ENVÍO (Resend)' : '🧪 DRY RUN — no se envía nada');
console.log(`From:     ${FROM}`);
console.log(`Reply-To: ${REPLY_TO}`);
console.log(`Asunto:   ${SUBJECT}`);
console.log(`Destinos: ${rows.length} empresas en el CSV`);
if (overrideTo) console.log(`Override: todo se enviaría a ${overrideTo} (modo prueba)`);
if (SEND && !apiKey) console.log('⚠  --send ignorado: falta RESEND_API_KEY en el entorno.');
console.log('='.repeat(72));

let sent = 0, skipped = 0;
for (const row of rows) {
  const to = overrideTo || row.email;
  const verified = row.verified.toLowerCase() === 'yes';
  const body = renderText(row);

  console.log(`\n──── ${row.company}  →  ${to}  ${verified ? '' : '⚠ unverified'}`);
  console.log(body);

  if (!willSend) { skipped++; continue; }
  if (!overrideTo && !verified) {
    console.log('   ⏭  saltada: email sin verificar (verified=no).');
    skipped++;
    continue;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject: SUBJECT, text: body }),
  });
  if (res.ok) { console.log('   ✅ enviado'); sent++; }
  else { console.log(`   ❌ error ${res.status}: ${await res.text()}`); skipped++; }
}

console.log('\n' + '='.repeat(72));
console.log(willSend ? `Enviados: ${sent} · Saltados: ${skipped}` : `Dry run: ${skipped} emails renderizados, 0 enviados.`);
if (!willSend) console.log('Para enviar de verdad: exporta RESEND_API_KEY, marca verified=yes y añade --send.');
console.log('='.repeat(72));
