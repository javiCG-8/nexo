-- Datos de demostración para Nexo (UTMACH y TechCorp). Idempotente: se puede ejecutar varias veces.
-- Contraseña unificada para todos los usuarios: Nexo123!

-- 1. Organizaciones (Tenants)
INSERT INTO organizations (name, slug)
VALUES 
  ('Universidad Técnica de Machala', 'utmach'),
  ('TechCorp Startup', 'techcorp')
ON CONFLICT (slug) DO NOTHING;

-- 2. Categorías por Organización
WITH org_utmach AS (SELECT id FROM organizations WHERE slug = 'utmach'),
     org_techcorp AS (SELECT id FROM organizations WHERE slug = 'techcorp')
INSERT INTO categories (organization_id, code, name)
SELECT id, 'COMPUTER', 'Equipos Informáticos y PCs' FROM org_utmach UNION ALL
SELECT id, 'NETWORK', 'Redes y Conectividad' FROM org_utmach UNION ALL
SELECT id, 'SOFTWARE', 'Software y Licencias' FROM org_utmach UNION ALL
SELECT id, 'PRINTER', 'Impresoras y Periféricos' FROM org_utmach UNION ALL
SELECT id, 'COMPUTER', 'Hardware y Laptops' FROM org_techcorp UNION ALL
SELECT id, 'NETWORK', 'Servidores y Redes' FROM org_techcorp UNION ALL
SELECT id, 'SOFTWARE', 'Herramientas Dev & Cloud' FROM org_techcorp
ON CONFLICT (organization_id, code) DO NOTHING;

-- 3. Usuarios de UTMACH
WITH org AS (SELECT id FROM organizations WHERE slug = 'utmach')
INSERT INTO users (organization_id, name, email, password_hash, role)
VALUES
  ((SELECT id FROM org), 'Carlos Mendoza (Estudiante)', 'user@example.test', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'USER'),
  ((SELECT id FROM org), 'Ing. María Rodríguez (Docente)', 'maria.rodriguez@utmach.edu.ec', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'USER'),
  ((SELECT id FROM org), 'Roberto Sánchez (Técnico Hardware)', 'tech@example.test', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'TECHNICIAN'),
  ((SELECT id FROM org), 'Andrea Jaramillo (Técnico Redes)', 'andrea.jaramillo@utmach.edu.ec', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'TECHNICIAN')
ON CONFLICT (organization_id, email) DO NOTHING;

-- 4. Usuarios de TechCorp
WITH org AS (SELECT id FROM organizations WHERE slug = 'techcorp')
INSERT INTO users (organization_id, name, email, password_hash, role)
VALUES
  ((SELECT id FROM org), 'David Pérez (Frontend Dev)', 'david.perez@techcorp.io', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'USER'),
  ((SELECT id FROM org), 'Sofía Castro (Diseñadora UX)', 'sofia.castro@techcorp.io', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'USER'),
  ((SELECT id FROM org), 'Alex Váldez (DevOps / SysAdmin)', 'alex.valdez@techcorp.io', '$2b$10$kk/H9JclabqxxXo7LnrjIeBANAGVH.etHNLLy2nO.BUIULm4aQNg.', 'TECHNICIAN')
ON CONFLICT (organization_id, email) DO NOTHING;

-- 5. Reportes de Prueba para UTMACH
WITH org AS (SELECT id FROM organizations WHERE slug = 'utmach'),
     user1 AS (SELECT id FROM users WHERE email = 'user@example.test' AND organization_id = (SELECT id FROM org)),
     user2 AS (SELECT id FROM users WHERE email = 'maria.rodriguez@utmach.edu.ec' AND organization_id = (SELECT id FROM org)),
     tech1 AS (SELECT id FROM users WHERE email = 'tech@example.test' AND organization_id = (SELECT id FROM org)),
     tech2 AS (SELECT id FROM users WHERE email = 'andrea.jaramillo@utmach.edu.ec' AND organization_id = (SELECT id FROM org)),
     cat_comp AS (SELECT id FROM categories WHERE code = 'COMPUTER' AND organization_id = (SELECT id FROM org)),
     cat_net AS (SELECT id FROM categories WHERE code = 'NETWORK' AND organization_id = (SELECT id FROM org)),
     cat_print AS (SELECT id FROM categories WHERE code = 'PRINTER' AND organization_id = (SELECT id FROM org)),
     cat_soft AS (SELECT id FROM categories WHERE code = 'SOFTWARE' AND organization_id = (SELECT id FROM org))
INSERT INTO reports (organization_id, title, description, category_id, priority, status, reporter_id, technician_id, resolution_notes, created_at, updated_at)
SELECT * FROM (VALUES
  (
    (SELECT id FROM org),
    'Pérdida de conectividad WiFi en Edificio Central',
    'Los estudiantes del aula 204 no pueden conectarse al punto de acceso WiFi institucional desde las 08:00 AM.',
    (SELECT id FROM cat_net),
    'HIGH',
    'IN_PROGRESS',
    (SELECT id FROM user1),
    (SELECT id FROM tech2),
    NULL,
    now() - interval '2 hours',
    now() - interval '1 hour'
  ),
  (
    (SELECT id FROM org),
    'Pantalla azul constante en laboratorio 3 - PC 12',
    'El computador de la estación 12 se reinicia aleatoriamente al ejecutar aplicaciones pesadas.',
    (SELECT id FROM cat_comp),
    'MEDIUM',
    'OPEN',
    (SELECT id FROM user1),
    NULL,
    NULL,
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  ),
  (
    (SELECT id FROM org),
    'Impresora de Decanato no reconoce cartucho de tóner',
    'La impresora HP LaserJet del área de Decanato muestra error de falta de tóner a pesar de haber insertado repuesto.',
    (SELECT id FROM cat_print),
    'LOW',
    'RESOLVED',
    (SELECT id FROM user2),
    (SELECT id FROM tech1),
    'Se limpiaron los contactos ópticos del sensor de tóner y se realizó página de prueba exitosa.',
    now() - interval '1 day',
    now() - interval '3 hours'
  ),
  (
    (SELECT id FROM org),
    'Licencia expirada de software estadístico en laboratorio',
    'Se requiere renovación urgente de la clave de producto para las 30 estaciones del laboratorio de investigación.',
    (SELECT id FROM cat_soft),
    'CRITICAL',
    'OPEN',
    (SELECT id FROM user2),
    NULL,
    NULL,
    now() - interval '10 minutes',
    now() - interval '10 minutes'
  )
) AS seed_reports
WHERE NOT EXISTS (SELECT 1 FROM reports WHERE organization_id = (SELECT id FROM org));

-- 6. Reportes de Prueba para TechCorp
WITH org AS (SELECT id FROM organizations WHERE slug = 'techcorp'),
     user_tc AS (SELECT id FROM users WHERE email = 'david.perez@techcorp.io' AND organization_id = (SELECT id FROM org)),
     tech_tc AS (SELECT id FROM users WHERE email = 'alex.valdez@techcorp.io' AND organization_id = (SELECT id FROM org)),
     cat_net_tc AS (SELECT id FROM categories WHERE code = 'NETWORK' AND organization_id = (SELECT id FROM org)),
     cat_comp_tc AS (SELECT id FROM categories WHERE code = 'COMPUTER' AND organization_id = (SELECT id FROM org))
INSERT INTO reports (organization_id, title, description, category_id, priority, status, reporter_id, technician_id, resolution_notes, created_at, updated_at)
SELECT * FROM (VALUES
  (
    (SELECT id FROM org),
    'Servidor de staging fuera de servicio',
    'El contenedor Docker de la base de datos de staging colapsó por falta de espacio en disco.',
    (SELECT id FROM cat_net_tc),
    'CRITICAL',
    'RESOLVED',
    (SELECT id FROM user_tc),
    (SELECT id FROM tech_tc),
    'Se ejecutó limpieza de logs docker prune y se ampliaron 50GB en el volumen EBS.',
    now() - interval '5 hours',
    now() - interval '2 hours'
  ),
  (
    (SELECT id FROM org),
    'Solicitud de segundo monitor para estación de diseño',
    'Se requiere pantalla adicional de 27 pulgadas para tareas de prototipado en Figma.',
    (SELECT id FROM cat_comp_tc),
    'LOW',
    'OPEN',
    (SELECT id FROM user_tc),
    NULL,
    NULL,
    now() - interval '1 hour',
    now() - interval '1 hour'
  )
) AS seed_reports
WHERE NOT EXISTS (SELECT 1 FROM reports WHERE organization_id = (SELECT id FROM org));
