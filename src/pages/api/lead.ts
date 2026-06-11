import type { APIRoute } from 'astro';
import { url } from '../../utils';

// Endpoint dinámico: no se prerenderiza, se ejecuta en el Worker de Cloudflare.
export const prerender = false;

const FIELDS = [
  'source',
  'fuente',
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

  const db = locals.runtime?.env?.DB;

  if (!db) {
    // En `astro dev` no hay binding de D1; toleramos para poder probar el flujo.
    if (import.meta.env.DEV) {
      console.warn('[api/lead] Sin binding DB (dev): lead no guardado.', data);
      return reply(wantsJson, 200, { ok: true, stored: false });
    }
    return reply(wantsJson, 500, { ok: false, error: 'Almacenamiento no disponible.' });
  }

  // La tabla `leads` exige nombre/email/mensaje NOT NULL. El diagnóstico no
  // envía `mensaje`, así que lo componemos a partir de la recomendación.
  const recomendacion = clean(data.recomendacion);
  const mensaje = clean(data.mensaje) ?? recomendacion ?? '(sin mensaje)';
  const fuente = clean(data.source) ?? clean(data.fuente) ?? 'contacto';
  const ip = clean(request.headers.get('cf-connecting-ip'));

  try {
    await db
      .prepare(
        `INSERT INTO leads
           (nombre, email, negocio, mensaje, fuente, user_agent, ip, sector, proceso, horas, metodo, recomendacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        clean(data.nombre) ?? '',
        email,
        clean(data.negocio),
        mensaje,
        fuente,
        clean(request.headers.get('user-agent')),
        ip,
        clean(data.sector),
        clean(data.proceso),
        clean(data.horas),
        clean(data.metodo),
        recomendacion,
      )
      .run();
  } catch (err) {
    console.error('[api/lead] Error al guardar el lead:', err);
    return reply(wantsJson, 500, { ok: false, error: 'No se pudo guardar el mensaje.' });
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
