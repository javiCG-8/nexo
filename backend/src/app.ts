import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isProduction } from './config/env';
import authRoutes from './auth/auth.routes';
import categoryRoutes from './categories/category.routes';
import { checkDatabase } from './db/pool';
import reportRoutes from './reports/report.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requireJson } from './middleware/require-json';

const app = express();

app.set('trust proxy', env.trustProxy);

// FR-007: la API solo devuelve JSON, por lo que la CSP más restrictiva posible es válida.
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: isProduction
}));

app.use(cors({
  origin: env.frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));

app.use(requireJson);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/v1/health/ready', async (_req, res) => {
  const databaseUp = await checkDatabase();
  res.status(databaseUp ? 200 : 503).json({ status: databaseUp ? 'ok' : 'unavailable', database: databaseUp });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
