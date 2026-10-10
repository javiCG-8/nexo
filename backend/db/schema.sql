-- Esquema inicial de Nexo. Ejecutar después de crear la base nexobd.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cada organización es un tenant aislado.
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  slug text NOT NULL UNIQUE CHECK (length(trim(slug)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Los correos solo deben ser únicos dentro de cada organización.
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  email text NOT NULL CHECK (length(trim(email)) > 0),
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('USER', 'TECHNICIAN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email),
  UNIQUE (id, organization_id)
);

-- Las categorías son datos, no valores fijos del código.
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  code text NOT NULL CHECK (length(trim(code)) > 0),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  active boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, code),
  UNIQUE (id, organization_id)
);

-- Todos los campos de negocio quedan ligados al tenant.
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 150),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 5000),
  category_id uuid NOT NULL,
  priority text NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  reporter_id uuid NOT NULL,
  technician_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (category_id, organization_id) REFERENCES categories(id, organization_id),
  FOREIGN KEY (reporter_id, organization_id) REFERENCES users(id, organization_id),
  FOREIGN KEY (technician_id, organization_id) REFERENCES users(id, organization_id)
);

CREATE INDEX reports_organization_status_idx ON reports (organization_id, status);
CREATE INDEX reports_organization_reporter_idx ON reports (organization_id, reporter_id);
