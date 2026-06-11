-- Columnas del diagnóstico exprés. Se guardan NULL en los leads del
-- formulario de contacto. Las añadimos con ALTER TABLE para no tocar la
-- tabla `leads` ya existente en producción ni sus datos.

ALTER TABLE leads ADD COLUMN sector TEXT;
ALTER TABLE leads ADD COLUMN proceso TEXT;
ALTER TABLE leads ADD COLUMN horas TEXT;
ALTER TABLE leads ADD COLUMN metodo TEXT;
ALTER TABLE leads ADD COLUMN recomendacion TEXT;
