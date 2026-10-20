// Variables de entorno de prueba: valores ficticios, nunca credenciales reales.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nexobd_test';
process.env.AUTH_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.PORT = '3000';
