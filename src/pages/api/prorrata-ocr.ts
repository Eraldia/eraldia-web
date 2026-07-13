import type { APIRoute } from 'astro';
// import { isAuthorized } from '../../lib/prorrata-auth';

// OCR de facturas para la calculadora de prorrata de IVA. Recibe la imagen de una
// factura (dataURL), la pasa por un modelo de visión de Cloudflare Workers AI y
// devuelve los campos estructurados que precargan la tabla editable. No guarda
// nada: la imagen solo se usa para leerla. Corre en el Worker.
export const prerender = false;

// Modelo de visión de Workers AI. Lee la imagen y extrae texto/campos.
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const SYSTEM_PROMPT = `Eres un asistente experto en facturas españolas. Analiza la
imagen de UNA factura y devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto
alrededor, sin markdown) con estas claves:
{
  "tipo": "emitida" | "recibida" | null,   // emitida = la emite quien usa la herramienta (ingreso/venta); recibida = gasto/compra. Si no está claro, null.
  "contraparte": string | null,             // nombre del cliente (si emitida) o proveedor (si recibida)
  "fecha": string | null,                   // fecha de la factura en formato AAAA-MM-DD si es legible
  "base": number | null,                    // base imponible total en euros (número, punto decimal)
  "cuotaIva": number | null,                // cuota de IVA total en euros (0 si exenta)
  "tipoIva": number | null,                 // tipo de IVA aplicado en % (21, 10, 4, 0...)
  "exenta": boolean,                        // true si la operación está exenta o no lleva IVA
  "articuloExencion": string | null,        // artículo/motivo de exención si aparece (p. ej. "art. 20 LIVA")
  "total": number | null,                   // importe total factura en euros
  "confianza": "alta" | "media" | "baja"    // tu confianza en la lectura
}
Reglas: usa punto como separador decimal y no incluyas símbolos de moneda ni miles.
Si un dato no es legible, ponlo a null. No inventes valores.`;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Extrae los bytes de una dataURL (data:image/...;base64,XXXX) como array de enteros.
function dataUrlToBytes(dataUrl: string): number[] | null {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return null;
  const b64 = dataUrl.slice(comma + 1);
  try {
    const bin = atob(b64);
    const bytes = new Array<number>(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// El modelo debería devolver JSON puro, pero por si acaso extraemos el primer
// bloque {...} y lo parseamos con tolerancia.
function parseModelJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;

  // Acceso temporalmente libre: sin comprobación de sesión. Para volver a
  // restringirlo, descomenta el import de isAuthorized y este bloque:
  //   const pass = env?.PRORRATA_PASS;
  //   if (!(await isAuthorized(request, pass, import.meta.env.DEV))) {
  //     return json(401, { ok: false, error: 'No autorizado.' });
  //   }

  let image: string | undefined;
  try {
    const body = (await request.json()) as { image?: string };
    image = body.image;
  } catch {
    return json(400, { ok: false, error: 'Cuerpo no válido.' });
  }
  if (!image || !image.startsWith('data:image/')) {
    return json(400, { ok: false, error: 'Falta la imagen de la factura.' });
  }

  const bytes = dataUrlToBytes(image);
  if (!bytes) return json(400, { ok: false, error: 'Imagen no válida.' });

  const ai = env?.AI;
  if (!ai) {
    // En dev sin binding de Workers AI no se puede hacer OCR; se devuelve una
    // fila vacía para que el asesor la rellene a mano y probar el flujo.
    if (import.meta.env.DEV) return json(200, { ok: true, data: {}, note: 'sin-binding-ai' });
    return json(503, { ok: false, error: 'OCR no disponible.' });
  }

  try {
    const result: any = await ai.run(MODEL, {
      prompt: SYSTEM_PROMPT,
      image: bytes,
      max_tokens: 512,
    });
    const text: string = typeof result?.response === 'string' ? result.response : '';
    const data = parseModelJson(text) ?? {};
    return json(200, { ok: true, data });
  } catch (err) {
    console.error('[api/prorrata-ocr] Error de Workers AI:', err);
    return json(502, { ok: false, error: 'No se pudo leer la factura.' });
  }
};
