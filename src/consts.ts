// ==========================================================================
// Constantes globales del sitio — equivalente al [extra] de config.toml de Zola
// ==========================================================================

export const SITE_TITLE = 'Eraldia';
export const SITE_DESCRIPTION =
  'Consultoría de IA y automatización para asesorías, gestorías y despachos de abogados. Menos trabajo repetitivo —facturas, plazos, consultas, expedientes— y más capacidad para crecer sin contratar. Precio cerrado y sin humo.';
export const TAGLINE = 'Pon tu pyme al día con la IA';
export const AUTHOR = 'Gorka Alapont';

// Correo público del dominio (Proton): footer, formulario, NAP.
export const CONTACT_EMAIL = 'hola@eraldia.com';

// Destinatario interno de los avisos de leads que envía /api/lead (puede ser
// distinto del email público de arriba).
export const LEAD_NOTIFY_TO = 'gorka@eraldia.com';

// Remitente de los avisos de leads (formulario de contacto y diagnóstico exprés).
// Debe ser una dirección de un dominio verificado en Resend; mientras eraldia.com
// no esté verificado, usar el remitente de pruebas 'onboarding@resend.dev'.
export const LEAD_NOTIFY_FROM = 'Eraldia <hola@eraldia.com>';

export const LINKEDIN_URL = '';
