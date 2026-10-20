// Pruebas de integración: usan una base PostgreSQL REAL y desechable, nunca la de desarrollo.
// En CI la provee un contenedor postgres:18; en local, crear `nexobd_test` (ver backend/db/README.md).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nexobd_test';
process.env.AUTH_SECRET = 'secreto-de-integracion-con-mas-de-32-caracteres';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.PORT = '3000';
