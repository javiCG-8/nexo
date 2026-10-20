import app from './app';
import { env } from './config/env';
import { pool } from './db/pool';

const server = app.listen(env.port, () => {
  console.log(`Nexo API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});

/** Cierre ordenado: deja de aceptar conexiones y libera el pool de PostgreSQL. */
function shutdown(signal: string) {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
