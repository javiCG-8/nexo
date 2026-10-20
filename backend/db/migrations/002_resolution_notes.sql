-- Migración 002: notas de solución al resolver un reporte (spec 002, FR-004/FR-006).
-- Idempotente: se puede ejecutar sobre bases creadas con versiones anteriores de schema.sql.
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes text;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_resolution_notes_check;
ALTER TABLE reports ADD CONSTRAINT reports_resolution_notes_check
  CHECK (resolution_notes IS NULL OR length(trim(resolution_notes)) BETWEEN 5 AND 2000);
