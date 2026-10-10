-- Reinicia completamente la base de datos de Nexo.
DROP TABLE IF EXISTS reports, categories, users, organizations CASCADE;
\ir schema.sql
\ir seed.sql
