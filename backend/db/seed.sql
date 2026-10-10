-- Datos iniciales de demostración para dos organizaciones.
-- Contraseña de todos los usuarios: Nexo123!
INSERT INTO organizations (name, slug)
VALUES ('UTMACH', 'utmach'), ('Empresa Demo', 'empresa-demo')
ON CONFLICT (slug) DO NOTHING;

-- Hash bcrypt de Nexo123!, generado con bcryptjs.
WITH orgs AS (
  SELECT id, slug FROM organizations WHERE slug IN ('utmach', 'empresa-demo')
)
INSERT INTO users (organization_id, name, email, password_hash, role)
SELECT id, CASE WHEN slug = 'utmach' THEN 'Usuario UTMACH' ELSE 'Usuario Demo' END,
       CASE WHEN slug = 'utmach' THEN 'usuario@utmach.edu.ec' ELSE 'usuario@empresa-demo.test' END,
       '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.',
       'USER'
FROM orgs
ON CONFLICT (organization_id, email) DO NOTHING;

WITH orgs AS (
  SELECT id, slug FROM organizations WHERE slug IN ('utmach', 'empresa-demo')
)
INSERT INTO users (organization_id, name, email, password_hash, role)
SELECT id, CASE WHEN slug = 'utmach' THEN 'Técnico UTMACH' ELSE 'Técnico Demo' END,
       CASE WHEN slug = 'utmach' THEN 'tecnico@utmach.edu.ec' ELSE 'tecnico@empresa-demo.test' END,
       '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.',
       'TECHNICIAN'
FROM orgs
ON CONFLICT (organization_id, email) DO NOTHING;

WITH orgs AS (
  SELECT id FROM organizations WHERE slug IN ('utmach', 'empresa-demo')
)
INSERT INTO categories (organization_id, code, name)
SELECT id, 'COMPUTER', 'Computadores' FROM orgs
ON CONFLICT (organization_id, code) DO NOTHING;

WITH orgs AS (
  SELECT id FROM organizations WHERE slug IN ('utmach', 'empresa-demo')
)
INSERT INTO categories (organization_id, code, name)
SELECT id, 'NETWORK', 'Redes' FROM orgs
ON CONFLICT (organization_id, code) DO NOTHING;
