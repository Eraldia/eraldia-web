// ==========================================================================
// Constantes globales del sitio — equivalente al [extra] de config.toml de Zola
// ==========================================================================

export const SITE_TITLE = 'Eraldia';
export const SITE_DESCRIPTION =
  'Consultoría de estrategia de IA para medianas empresas en España. Diseño e implanto tu sistema operativo de IA: estrategia, gobierno, datos, procesos y personas preparadas para la era de la IA. Sin humo. También automatización para pymes y despachos.';
export const TAGLINE = 'El sistema operativo de IA de tu empresa';
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

// Perfil de Twitter/X (handle y URL): Twitter Cards y sameAs del schema.
export const TWITTER_HANDLE = '@alapontg';
export const TWITTER_URL = 'https://twitter.com/alapontg';
