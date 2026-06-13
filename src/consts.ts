// ==========================================================================
// Constantes globales del sitio — equivalente al [extra] de config.toml de Zola
// ==========================================================================

export const SITE_TITLE = 'Eraldia';
export const SITE_DESCRIPTION =
  'Consultoría de transformación digital e inteligencia artificial para pymes. Automatizaciones con precio cerrado, resultados medibles y sin humo.';
export const TAGLINE = 'Pon tu pyme al día con la IA';
export const AUTHOR = 'Gorka Alapont';

// Correo del dominio (Proton). Es el email público (footer, contacto) y el
// destino de los avisos de leads que envía /api/lead.
export const CONTACT_EMAIL = 'hello@eraldia.com';

// Remitente de los avisos de leads (formulario de contacto y diagnóstico exprés).
// Debe ser una dirección de un dominio verificado en Resend; mientras eraldia.com
// no esté verificado, usar el remitente de pruebas 'onboarding@resend.dev'.
export const LEAD_NOTIFY_FROM = 'Eraldia web <web@eraldia.com>';

export const LINKEDIN_URL = '';
