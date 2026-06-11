-- Tabla base de leads de Eraldia (esquema canónico, ya existente en producción).
-- Recoge los envíos del formulario de contacto. El diagnóstico exprés añade
-- columnas extra en la migración 0002.
-- En producción la tabla ya existe; este CREATE ... IF NOT EXISTS solo actúa en
-- bases nuevas (local/preview) para que el esquema coincida con el de producción.

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL,
  negocio     TEXT,
  mensaje     TEXT NOT NULL,
  fuente      TEXT,                       -- 'contacto' | 'diagnostico'
  user_agent  TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads (fuente);
