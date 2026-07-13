import type { APIRoute } from 'astro';
import { url } from '../../utils';
import { passwordMatches, signSession, sessionCookieHeader } from '../../lib/prorrata-auth';

// Login de la herramienta interna de prorrata de IVA. Valida la contraseña
// compartida (secret PRORRATA_PASS) y, si acierta, fija una cookie de sesión
// firmada y redirige a la herramienta. No se prerenderiza: corre en el Worker.
export const prerender = false;

const TOOL_PATH = '/herramientas/prorrata-iva/';

export const POST: APIRoute = async ({ request, locals }) => {
  const pass = locals.runtime?.env?.PRORRATA_PASS;

  let input = '';
  try {
    const form = await request.formData();
    input = String(form.get('password') ?? '');
  } catch {
    return redirect(url(TOOL_PATH) + '?error=1');
  }

  // Sin secret configurado: en dev el acceso ya está abierto (no hace falta
  // sesión); en producción, sin contraseña no se puede entrar.
  if (!pass) {
    if (import.meta.env.DEV) return redirect(url(TOOL_PATH));
    return redirect(url(TOOL_PATH) + '?error=config');
  }

  if (!passwordMatches(pass, input)) {
    return redirect(url(TOOL_PATH) + '?error=1');
  }

  const token = await signSession(pass);
  return new Response(null, {
    status: 303,
    headers: {
      Location: url(TOOL_PATH),
      'Set-Cookie': sessionCookieHeader(token),
    },
  });
};

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}
