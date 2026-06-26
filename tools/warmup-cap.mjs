#!/usr/bin/env node
// Imprime el cupo TOTAL de correos para hoy según la rampa de calentamiento
// (tools/warmup.json). Antes de 'start' imprime 0 (no se envía). Lo usa el
// GitHub Action para repartir ese presupuesto entre los sectores.
//
// Uso: node tools/warmup-cap.mjs   → imprime un número (p.ej. 15)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(__dirname, 'warmup.json'), 'utf8'));

const start = new Date(cfg.start + 'T00:00:00Z');
const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
const dayNumber = Math.floor((today - start) / 86400000) + 1; // día 1 = 'start'

let cap = 0;
if (dayNumber >= 1) {
  const last = cfg.steps[cfg.steps.length - 1];
  cap = last.perDay;
  for (const s of cfg.steps) {
    if (dayNumber <= s.throughDay) { cap = s.perDay; break; }
  }
}
process.stdout.write(String(cap));
