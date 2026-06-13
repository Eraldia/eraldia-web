import type { APIRoute } from 'astro';
import { CONTACT_EMAIL, LEAD_NOTIFY_FROM } from '../../consts';

// Endpoint de diagnóstico TEMPORAL para confirmar, tras un deploy, que el
// Worker ve la RESEND_API_KEY y que Resend la acepta. Nunca devuelve el valor
// del secreto, solo si está presente. Eliminar cuando se confirme el envío.
//
//   GET /api/email-check/         -> presencia de key y bindings
//   GET /api/email-check/?ping=1  -> además pregunta a Resend (estado del dominio)
export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const env = locals.runtime?.env;
  const keyPresent = Boolean(env?.RESEND_API_KEY);

  const body: Record<string, unknown> = {
    resendKeyPresent: keyPresent,
    dbBound: Boolean(env?.DB),
    from: LEAD_NOTIFY_FROM,
    to: CONTACT_EMAIL,
  };

  if (url.searchParams.get('ping') === '1' && keyPresent) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${env!.RESEND_API_KEY}` },
      });
      body.resendStatus = res.status; // 200 = key válida; 401 = key inválida
      if (res.ok) {
        const data: any = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        body.domains = list.map((d: any) => ({ name: d.name, status: d.status, region: d.region }));
      } else {
        body.resendError = (await res.text()).slice(0, 300);
      }
    } catch (e) {
      body.resendStatus = 'fetch-failed';
      body.resendError = String(e).slice(0, 300);
    }
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
