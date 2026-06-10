# Pipeline de contenidos — publicación automática cada 3 días

Cómo funciona el sistema que publica un post **cada 3 días** en la web y en
LinkedIn, sin coste de API y sin intervención manual.

## Idea general

```
 [Sesión de Claude]            [Repositorio]                 [Cada día, 06:30 UTC]
 redacta un lote de   ──────▶  content-queue/posts/  ──────▶  publish-content.yml
 posts + textos LinkedIn       (cola ordenada)                │
 (con tu suscripción,          NN-slug.md                     ├─ ¿Han pasado 3 días
  sin API)                     NN-slug.linkedin.md            │  desde el último post?
                                                              ├─ Sí → mueve la pieza a
                                                              │  src/content/blog/, fija
                                                              │  la fecha, commit + push
                                                              │  (el push despliega la web)
                                                              └─ Publica en LinkedIn
```

La **generación** y la **publicación** están separadas a propósito:

- La generación la haces tú con Claude en una sesión normal (suscripción, no
  API), por lotes de ~10 piezas. Puedes revisar y editar cada pieza antes de
  que se publique — está en el repo como un fichero más.
- La publicación es un script tonto (`tools/publish-next.mjs`, Node sin
  dependencias) que un cron de GitHub Actions ejecuta a diario. Solo publica si
  el último post tiene ≥3 días. Sin IA en tiempo de ejecución, nada puede
  "alucinar" en producción.

## Estructura de la cola

```
content-queue/posts/
├── 01-cuanto-cuesta-automatizacion-ia-pyme.md           ← post completo (sin fecha)
├── 01-cuanto-cuesta-automatizacion-ia-pyme.linkedin.md  ← texto nativo para LinkedIn
├── 02-que-hace-consultor-ia-pyme.md
├── 02-que-hace-consultor-ia-pyme.linkedin.md
└── ...
```

- El prefijo numérico define el **orden de publicación**; el slug final no lo
  incluye (`01-foo.md` se publica como `foo.md`).
- El frontmatter es el del blog (`title`, `description`, `tags`, `categories`);
  la `date` la pone el script el día que publica.
- En el texto de LinkedIn, `{{URL}}` se sustituye por la URL final del post.

## Activación (una vez)

1. **Mergear esta rama a `main`.** El cron solo corre en la rama por defecto.
2. **LinkedIn (opcional pero recomendado)** — ver sección siguiente. Sin
   credenciales, el workflow abre un issue con el texto listo para copiar y
   pegar, y la web se publica igualmente.
3. Para probar sin esperar: pestaña *Actions* → *Publish queued content* →
   *Run workflow* (con `force` publica aunque no hayan pasado 3 días).

## LinkedIn

Para publicar automáticamente hacen falta dos secrets en el repositorio
(*Settings → Secrets and variables → Actions*):

| Secret | Qué es |
|--------|--------|
| `LINKEDIN_ACCESS_TOKEN` | Token OAuth con permiso de publicación |
| `LINKEDIN_AUTHOR_URN` | `urn:li:person:XXXX` (perfil) o `urn:li:organization:XXXX` (página) |

Cómo obtenerlos:

1. Crea una app en <https://developer.linkedin.com> asociada a tu página de
   empresa.
2. **Perfil personal**: añade el producto *"Share on LinkedIn"* (self-service) →
   scope `w_member_social`. **Página de empresa**: solicita acceso al
   *Community Management API* → scope `w_organization_social` (requiere
   aprobación de LinkedIn; mientras llega, usa el perfil personal — para marca
   personal de consultor suele funcionar mejor de todos modos).
3. Genera el token con el *OAuth token generator* de la app y guárdalo como
   secret.

**Caducidad:** los tokens de LinkedIn duran ~60 días. Cuando caduque, el
workflow no falla: abre un issue `linkedin-pendiente` con el texto para
publicar a mano, hasta que regeneres el token.

## Rellenar la cola

Cuando queden ≤2 piezas, el workflow abre un issue `rellenar-cola`. Entonces:

1. Abre una sesión de Claude (Code o web) sobre este repositorio.
2. Pide algo como:

   > Lee docs/PLAN-DE-CONTENIDOS.md y docs/PIPELINE-CONTENIDOS.md. Redacta las
   > siguientes N piezas de la cola editorial (continúa la numeración de
   > content-queue/posts/) siguiendo la plantilla GEO del plan: respuesta
   > directa al inicio, cifras con fecha, FAQs al final, una frase citable, un
   > enlace a servicios y otro a una landing local. Incluye el .linkedin.md de
   > cada una. Sin tópicos regionales. Commit y push.

3. Revisa el diff (es contenido público con tu nombre) y mergea.

Reglas de redacción que la cola debe respetar:

- **Sin estereotipos regionales** (gastronomía, folclore, clichés). La
  localización se hace con sectores, ayudas y cercanía, no con tópicos.
- **Euskera: solo unas palabras** donde aporte (un saludo, la etimología de
  *eraldia*), nunca párrafos.
- Cifras y precios siempre con año ("precios de 2026").
- Datos de ayudas/subvenciones: verificar la convocatoria vigente antes de
  redactar, o referirse a ellas de forma genérica con enlace a la fuente.
- Nunca inventar clientes ni casos: si no hay caso real publicable, no se
  escribe la pieza de caso.

## Ajustes

| Qué | Dónde |
|-----|-------|
| Cadencia (3 días) | `CADENCE_DAYS` en el step del workflow, o en `tools/publish-next.mjs` |
| Hora de publicación | `cron` en `.github/workflows/publish-content.yml` |
| URL base del sitio | `SITE_URL` en el workflow (cámbiala al activar eraldia.com) |
