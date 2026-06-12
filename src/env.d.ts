/// <reference path="../.astro/types.d.ts" />

// Subconjunto mínimo de la API de D1 que usamos en el endpoint de leads.
// Evita depender de @cloudflare/workers-types como dependencia del proyecto.
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run<T = unknown>(): Promise<T>;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface CloudflareEnv {
  DB: D1Database;
  // Clave de API de Resend para enviar el aviso de leads por email.
  // Es un secreto del Worker: `npx wrangler secret put RESEND_API_KEY`
  // (en local, en .dev.vars). Puede faltar: el lead se guarda igualmente.
  RESEND_API_KEY?: string;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: CloudflareEnv;
      // En Cloudflare, ctx.waitUntil prolonga la vida del Worker para tareas
      // en segundo plano (enviar el email sin retrasar la respuesta del form).
      ctx?: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
