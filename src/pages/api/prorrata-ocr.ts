import type { APIRoute } from 'astro';
// import { isAuthorized } from '../../lib/prorrata-auth';

// OCR de facturas para la calculadora de prorrata de IVA. Recibe la imagen de una
// factura (dataURL), la pasa por un modelo de visión de Cloudflare Workers AI y
// devuelve los campos estructurados que precargan la tabla editable. No guarda
// nada: la imagen solo se usa para leerla. Corre en el Worker.
export const prerender = false;

// Modelo de visión de Workers AI. Lee la imagen y extrae texto/campos.
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const SYSTEM_PROMPT = `Analiza la imagen de UNA factura española y devuelve SOLO un
objeto JSON válido: sin explicaciones, sin comentarios y sin bloques de código.
Usa exactamente estas claves:
- "tipo": "emitida" o "recibida" o null (emitida = ingreso/venta; recibida = gasto/compra)
- "contraparte": nombre del cliente o proveedor, o null
- "fecha": fecha de la factura como "AAAA-MM-DD", o null
- "base": base imponible total en euros (número), o null
- "cuotaIva": cuota de IVA total en euros (número, 0 si exenta), o null
- "tipoIva": tipo de IVA en % (21, 10, 4, 0), o null
- "exenta": true o false
- "articuloExencion": artículo o motivo de exención si aparece, o null
- "total": importe total de la factura en euros (número), o null
- "confianza": "alta", "media" o "baja"
Los números con punto decimal, sin separador de miles ni símbolo de moneda. Si un
dato no es legible, usa null. No inventes valores. Responde únicamente con el JSON.`;

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

// El modelo debería devolver JSON puro, pero por si acaso limpiamos bloques de
// código, comentarios y comas colgantes antes de parsear el primer objeto {...}.
function parseModelJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let body = t.slice(start, end + 1);
  body = body.replace(/\/\/[^\n\r]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  body = body.replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(body);
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
    const data = parseModelJson(text);
    // `raw` se devuelve para poder diagnosticar desde el navegador cuando el
    // modelo no da un JSON parseable (herramienta interna, sin datos sensibles
    // más allá de la propia factura).
    if (!data || Object.keys(data).length === 0) {
      console.warn('[api/prorrata-ocr] Respuesta del modelo sin JSON útil:', text.slice(0, 400));
      return json(200, { ok: true, data: {}, raw: text.slice(0, 800) });
    }
    return json(200, { ok: true, data });
  } catch (err) {
    console.error('[api/prorrata-ocr] Error de Workers AI:', err);
    return json(502, { ok: false, error: 'No se pudo leer la factura.' });
  }
};
