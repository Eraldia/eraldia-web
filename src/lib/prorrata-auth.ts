// Autenticación mínima por contraseña compartida para la herramienta interna de
// prorrata de IVA (/herramientas/prorrata-iva/). No hay usuarios ni base de
// datos: una sola contraseña (secret PRORRATA_PASS) protege el acceso.
//
// La sesión es un token firmado con HMAC-SHA256 usando la propia contraseña como
// clave. Así el Worker valida la cookie sin guardar estado. Formato del token:
//   <expiraEnMs>.<firmaBase64Url>
// donde la firma cubre la cadena "<expiraEnMs>". Web Crypto está disponible tanto
// en el Worker de Cloudflare como en `astro dev` (Node ≥ 18).

export const SESSION_COOKIE = 'prorrata_ok';

// Duración de la sesión: 30 días.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function base64UrlEncode(bytes: ArrayBuffer): string {
  const b = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(pass: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pass),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return base64UrlEncode(sig);
}

/** Compara dos cadenas en tiempo constante para no filtrar información por timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ¿La contraseña recibida coincide con el secret? (comparación en tiempo constante) */
export function passwordMatches(pass: string, input: string): boolean {
  return Boolean(pass) && safeEqual(pass, input);
}

/** Crea un token de sesión firmado, válido durante MAX_AGE_MS. */
export async function signSession(pass: string): Promise<string> {
  const expires = String(Date.now() + MAX_AGE_MS);
  const sig = await hmac(pass, expires);
  return `${expires}.${sig}`;
}

/** Valida un token de sesión: firma correcta y no caducado. */
export async function verifySession(pass: string, token: string | undefined): Promise<boolean> {
  if (!pass || !token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const expires = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expiresMs = Number(expires);
  if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) return false;
  const expected = await hmac(pass, expires);
  return safeEqual(sig, expected);
}

/** Lee el valor de una cookie de la cabecera Cookie. */
export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/**
 * Resuelve el acceso a partir de la petición y el entorno del Worker.
 * En `astro dev` sin PRORRATA_PASS configurado, el acceso queda abierto para
 * poder probar el flujo (igual que lead.ts tolera la falta del binding DB).
 */
export async function isAuthorized(
  request: Request,
  pass: string | undefined,
  isDev: boolean,
): Promise<boolean> {
  if (!pass) return isDev; // sin secret: abierto solo en desarrollo
  const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
  return verifySession(pass, token);
}

/** Cabecera Set-Cookie para fijar la sesión (HttpOnly, Secure, SameSite=Strict). */
export function sessionCookieHeader(token: string): string {
  const maxAge = Math.floor(MAX_AGE_MS / 1000);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
