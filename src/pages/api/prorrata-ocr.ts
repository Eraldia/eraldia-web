import type { APIRoute } from 'astro';
// import { isAuthorized } from '../../lib/prorrata-auth';

// Lectura de facturas para la calculadora de prorrata de IVA. Acepta dos
// entradas y usa el modelo de Workers AI adecuado:
//   - { text }  -> texto ya extraído del PDF (PDF digital): modelo de TEXTO,
//                  mucho más fiable con los importes.
//   - { image } -> imagen (foto/escaneo): modelo de VISIÓN como respaldo.
// Devuelve los campos estructurados que precargan la tabla editable. No guarda
// nada. Corre en el Worker.
export const prerender = false;

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

// Esquema común pedido al modelo (mismas claves en ambos caminos).
const SCHEMA = `Usa exactamente estas claves:
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
dato no es legible, usa null. No inventes valores. Responde SOLO con el objeto JSON,
sin explicaciones, sin comentarios y sin bloques de código.`;

const VISION_PROMPT = `Analiza la imagen de UNA factura española y devuelve SOLO un objeto JSON válido. ${SCHEMA}`;
const TEXT_SYSTEM = `Eres un extractor de datos de facturas españolas. A partir del texto de UNA factura, devuelve SOLO un objeto JSON válido. ${SCHEMA}`;

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

// Empaqueta el resultado: si no hay JSON útil, devuelve `raw` para diagnóstico.
function respond(out: string): Response {
  const data = parseModelJson(out);
  if (!data || Object.keys(data).length === 0) {
    console.warn('[api/prorrata-ocr] Respuesta del modelo sin JSON útil:', out.slice(0, 400));
    return json(200, { ok: true, data: {}, raw: out.slice(0, 800) });
  }
  return json(200, { ok: true, data });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;

  // Acceso temporalmente libre: sin comprobación de sesión. Para volver a
  // restringirlo, descomenta el import de isAuthorized y este bloque:
  //   const pass = env?.PRORRATA_PASS;
  //   if (!(await isAuthorized(request, pass, import.meta.env.DEV))) {
  //     return json(401, { ok: false, error: 'No autorizado.' });
  //   }

  let payload: { image?: string; text?: string };
  try {
    payload = (await request.json()) as { image?: string; text?: string };
  } catch {
    return json(400, { ok: false, error: 'Cuerpo no válido.' });
  }

  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  const image = payload.image;

  if (!text && (!image || !image.startsWith('data:image/'))) {
    return json(400, { ok: false, error: 'Falta el contenido de la factura.' });
  }

  const ai = env?.AI;
  if (!ai) {
    // En dev sin binding de Workers AI no se puede leer; se devuelve una fila
    // vacía para que el asesor la rellene a mano y poder probar el flujo.
    if (import.meta.env.DEV) return json(200, { ok: true, data: {}, note: 'sin-binding-ai' });
    return json(503, { ok: false, error: 'OCR no disponible.' });
  }

  try {
    // Camino de TEXTO (PDF digital): modelo de texto sobre el texto extraído.
    if (text) {
      const result: any = await ai.run(TEXT_MODEL, {
        messages: [
          { role: 'system', content: TEXT_SYSTEM },
          { role: 'user', content: text.slice(0, 6000) },
        ],
        max_tokens: 512,
      });
      const out: string = typeof result?.response === 'string' ? result.response : '';
      return respond(out);
    }

    // Camino de VISIÓN (foto/escaneo): modelo de visión sobre la imagen.
    const bytes = dataUrlToBytes(image as string);
    if (!bytes) return json(400, { ok: false, error: 'Imagen no válida.' });
    const result: any = await ai.run(VISION_MODEL, {
      prompt: VISION_PROMPT,
      image: bytes,
      max_tokens: 512,
    });
    const out: string = typeof result?.response === 'string' ? result.response : '';
    return respond(out);
  } catch (err) {
    console.error('[api/prorrata-ocr] Error de Workers AI:', err);
    return json(502, { ok: false, error: 'No se pudo leer la factura.' });
  }
};
