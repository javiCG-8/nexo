import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  authSecret: required('AUTH_SECRET'),
  frontendOrigin: required('FRONTEND_ORIGIN'),
  /** Número de proxies de confianza (p. ej. 1 detrás de un balanceador) para obtener la IP real. */
  trustProxy: Number(process.env.TRUST_PROXY ?? 0)
};

export const isProduction = env.nodeEnv === 'production';

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535');
}

if (env.authSecret.length < 32) {
  throw new Error('AUTH_SECRET debe tener al menos 32 caracteres');
}

try {
  new URL(env.frontendOrigin);
} catch {
  throw new Error('FRONTEND_ORIGIN debe ser una URL válida, por ejemplo http://localhost:4200');
}
