import type { APIRoute } from 'astro';
import { url } from '../../utils';
import { CONTACT_EMAIL, LEAD_NOTIFY_FROM } from '../../consts';

// Endpoint dinámico: no se prerenderiza, se ejecuta en el Worker de Cloudflare.
export const prerender = false;

const FIELDS = [
  'source',
  'nombre',
  'email',
  'negocio',
  'mensaje',
  'sector',
  'proceso',
  'horas',
  'metodo',
  'recomendacion',
] as const;

type Field = (typeof FIELDS)[number];
type LeadData = Partial<Record<Field, string>> & { _gotcha?: string };
type Lead = Record<Field, string | null>;

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2000) : null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const contentType = request.headers.get('content-type') ?? '';
  const wantsJson =
    contentType.includes('application/json') ||
    (request.headers.get('accept') ?? '').includes('application/json');

  // Parseo del cuerpo (JSON desde el JS, form-urlencoded sin JS)
  let data: LeadData = {};
  try {
    if (contentType.includes('application/json')) {
      data = (await request.json()) as LeadData;
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form) as LeadData;
    }
  } catch {
    return reply(wantsJson, 400, { ok: false, error: 'Cuerpo de la petición no válido.' });
  }

  // Honeypot anti-spam: si viene relleno, fingimos éxito y descartamos.
  if (clean(data._gotcha)) {
    return reply(wantsJson, 200, { ok: true });
  }

  const email = clean(data.email);
  if (!email || !email.includes('@')) {
    return reply(wantsJson, 400, { ok: false, error: 'Hace falta un email válido.' });
  }

  // Campos saneados una sola vez: se usan para guardar y para el aviso por email.
  const lead: Lead = {
    source: clean(data.source) ?? 'contacto',
    nombre: clean(data.nombre),
    email,
    negocio: clean(data.negocio),
    mensaje: clean(data.mensaje),
    sector: clean(data.sector),
    proceso: clean(data.proceso),
    horas: clean(data.horas),
    metodo: clean(data.metodo),
    recomendacion: clean(data.recomendacion),
  };

  const db = locals.runtime?.env?.DB;

  if (!db) {
    // En `astro dev` no hay binding de D1; toleramos para poder probar el flujo.
    if (import.meta.env.DEV) {
      console.warn('[api/lead] Sin binding DB (dev): lead no guardado.', data);
      return reply(wantsJson, 200, { ok: true, stored: false });
    }
    return reply(wantsJson, 500, { ok: false, error: 'Almacenamiento no disponible.' });
  }

  try {
    await db
      .prepare(
        `INSERT INTO leads
           (source, nombre, email, negocio, mensaje, sector, proceso, horas, metodo, recomendacion, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        lead.source,
        lead.nombre,
        lead.email,
        lead.negocio,
        lead.mensaje,
        lead.sector,
        lead.proceso,
        lead.horas,
        lead.metodo,
        lead.recomendacion,
        clean(request.headers.get('user-agent')),
      )
      .run();
  } catch (err) {
    console.error('[api/lead] Error al guardar el lead:', err);
    return reply(wantsJson, 500, { ok: false, error: 'No se pudo guardar el mensaje.' });
  }

  // Aviso por email a Gorka. No debe afectar a la respuesta del formulario: el
  // lead ya está guardado. Si hay ctx.waitUntil, se envía en segundo plano para
  // no añadir latencia; si no, se espera pero se tolera cualquier fallo.
  const apiKey = locals.runtime?.env?.RESEND_API_KEY;
  if (apiKey) {
    const sending = notifyByEmail(apiKey, lead).catch((err) => {
      console.error('[api/lead] No se pudo enviar el aviso por email:', err);
    });
    const waitUntil = locals.runtime?.ctx?.waitUntil;
    if (waitUntil) waitUntil(sending);
    else await sending;
  } else if (!import.meta.env.DEV) {
    console.warn('[api/lead] RESEND_API_KEY no configurado: lead guardado, sin aviso por email.');
  }

  if (wantsJson) {
    return reply(true, 200, { ok: true });
  }
  // Envío sin JavaScript: redirige a la página de gracias.
  return new Response(null, {
    status: 303,
    headers: { Location: url('/gracias/') },
  });
};

// Etiquetas legibles para el correo de aviso.
const LABELS: Record<Field, string> = {
  source: 'Origen',
  nombre: 'Nombre',
  email: 'Email',
  negocio: 'Negocio',
  mensaje: 'Mensaje',
  sector: 'Sector',
  proceso: 'Proceso',
  horas: 'Horas/semana',
  metodo: 'Cómo lo hace ahora',
  recomendacion: 'Recomendación mostrada',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Envía el aviso de un nuevo lead a Gorka vía la API de Resend.
async function notifyByEmail(apiKey: string, lead: Lead): Promise<void> {
  const esDiagnostico = lead.source === 'diagnostico';
  const quien = lead.nombre || lead.email || 'sin nombre';
  const subject = `Nuevo lead${esDiagnostico ? ' (diagnóstico exprés)' : ' (contacto)'}: ${quien}`;

  const rows = FIELDS.filter((f) => lead[f])
    .map(
      (f) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6256;vertical-align:top;white-space:nowrap;">${LABELS[f]}</td>` +
        `<td style="padding:4px 0;color:#15120e;">${escapeHtml(lead[f] as string)}</td></tr>`,
    )
    .join('');

  const html =
    `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5;color:#15120e;">` +
    `<p style="margin:0 0 16px;">Nuevo lead desde la web de Eraldia.</p>` +
    `<table style="border-collapse:collapse;">${rows}</table>` +
    `<p style="margin:16px 0 0;color:#6b6256;">Responde directamente a este correo para contestar al lead.</p>` +
    `</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: LEAD_NOTIFY_FROM,
      to: [CONTACT_EMAIL],
      subject,
      html,
      // Responder al correo de aviso escribe directamente al lead.
      ...(lead.email ? { reply_to: lead.email } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

function reply(json: boolean, status: number, body: Record<string, unknown>): Response {
  if (json) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  // Fallback sin JS: éxito → /gracias/, error → vuelve al contacto.
  const location = body.ok ? url('/gracias/') : url('/#contacto');
  return new Response(null, { status: 303, headers: { Location: location } });
}
