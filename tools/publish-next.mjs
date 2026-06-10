#!/usr/bin/env node
// Publica la siguiente pieza de content-queue/ en el blog y, si hay
// credenciales, en LinkedIn. Pensado para ejecutarse a diario desde GitHub
// Actions: solo publica si el último post tiene 3 días o más (FORCE=1 salta
// la espera). No usa ninguna IA en tiempo de ejecución: el contenido ya está
// redactado en la cola.
//
// Variables de entorno:
//   FORCE=1                  publica aunque no hayan pasado 3 días
//   CADENCE_DAYS             días entre posts (por defecto 3)
//   LINKEDIN_ACCESS_TOKEN    token OAuth de LinkedIn (opcional)
//   LINKEDIN_AUTHOR_URN      urn:li:person:XXX o urn:li:organization:XXX
//   SITE_URL                 base pública del sitio para el enlace del post
//   GITHUB_OUTPUT            (lo define Actions) para exponer resultados

import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, appendFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const QUEUE_DIR = join(ROOT, 'content-queue', 'posts');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const CADENCE_DAYS = Number(process.env.CADENCE_DAYS || 3);
const SITE_URL = (process.env.SITE_URL || 'https://sailwave-ai.github.io/eraldia-web').replace(/\/$/, '');

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function todayMadrid() {
  // Fecha local de Madrid en formato YYYY-MM-DD
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}

function latestPostDate() {
  let latest = null;
  for (const f of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))) {
    const m = readFileSync(join(BLOG_DIR, f), 'utf8').match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (m && (!latest || m[1] > latest)) latest = m[1];
  }
  return latest;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

// --- 1. ¿Toca publicar? ---------------------------------------------------
const today = todayMadrid();
const latest = latestPostDate();
if (!process.env.FORCE && latest && daysBetween(latest, today) < CADENCE_DAYS) {
  console.log(`Último post: ${latest}. Aún no han pasado ${CADENCE_DAYS} días. Nada que hacer.`);
  setOutput('published', 'false');
  process.exit(0);
}

// --- 2. Siguiente pieza de la cola -----------------------------------------
const queued = existsSync(QUEUE_DIR)
  ? readdirSync(QUEUE_DIR).filter((f) => f.endsWith('.md') && !f.endsWith('.linkedin.md')).sort()
  : [];
if (queued.length === 0) {
  console.log('La cola está vacía. Rellénala siguiendo docs/PIPELINE-CONTENIDOS.md.');
  setOutput('published', 'false');
  setOutput('queue_empty', 'true');
  process.exit(0);
}

const queueFile = queued[0];
const slug = basename(queueFile, '.md').replace(/^\d+-/, '');
let post = readFileSync(join(QUEUE_DIR, queueFile), 'utf8');

// Fija la fecha de publicación en el frontmatter
if (/^date:/m.test(post)) {
  post = post.replace(/^date:.*$/m, `date: ${today}`);
} else {
  post = post.replace(/^---\n/, `---\ndate: ${today}\n`);
}

writeFileSync(join(BLOG_DIR, `${slug}.md`), post);
unlinkSync(join(QUEUE_DIR, queueFile));
console.log(`Publicado en el blog: ${slug}.md (fecha ${today}). Quedan ${queued.length - 1} piezas en cola.`);
setOutput('published', 'true');
setOutput('slug', slug);
setOutput('remaining', String(queued.length - 1));
if (queued.length - 1 <= 2) setOutput('queue_low', 'true');

// --- 3. LinkedIn ------------------------------------------------------------
const liFile = join(QUEUE_DIR, queueFile.replace(/\.md$/, '.linkedin.md'));
const postUrl = `${SITE_URL}/blog/${slug}/`;
let liText = null;
if (existsSync(liFile)) {
  liText = readFileSync(liFile, 'utf8').trim().replaceAll('{{URL}}', postUrl);
  unlinkSync(liFile);
}

if (!liText) {
  console.log('Sin texto de LinkedIn para esta pieza; se omite.');
  process.exit(0);
}

const token = process.env.LINKEDIN_ACCESS_TOKEN;
const author = process.env.LINKEDIN_AUTHOR_URN;
if (!token || !author) {
  // Sin credenciales: deja el texto disponible para publicación manual.
  console.log('LINKEDIN_ACCESS_TOKEN / LINKEDIN_AUTHOR_URN no configurados.');
  console.log('--- Texto para publicar manualmente en LinkedIn ---\n');
  console.log(liText);
  writeFileSync(join(ROOT, 'linkedin-pending.md'), `Post: ${postUrl}\n\n${liText}\n`);
  setOutput('linkedin', 'manual');
  process.exit(0);
}

// La API de LinkedIn trata estos caracteres como formato: hay que escaparlos.
const escaped = liText.replace(/[\\|{}@\[\]()<>#*_~]/g, (c) => '\\' + c);

const res = await fetch('https://api.linkedin.com/rest/posts', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': process.env.LINKEDIN_VERSION || '202506',
  },
  body: JSON.stringify({
    author,
    commentary: escaped,
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: {
      article: {
        source: postUrl,
        title: (post.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1] || slug,
      },
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  }),
});

if (res.ok) {
  console.log(`Publicado en LinkedIn (${res.headers.get('x-restli-id') || 'ok'}).`);
  setOutput('linkedin', 'ok');
} else {
  // No fallamos el job: el post web ya está publicado. Guardamos el texto.
  console.error(`Error de LinkedIn ${res.status}: ${await res.text()}`);
  writeFileSync(join(ROOT, 'linkedin-pending.md'), `Post: ${postUrl}\n\n${liText}\n`);
  setOutput('linkedin', 'error');
}
