import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import authRoutes from './auth/auth.routes';
import categoryRoutes from './categories/category.routes';
import reportRoutes from './reports/report.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use(errorHandler);

export default app;

if (require.main === module) {
  app.listen(env.port, () => console.log(`Nexo API escuchando en http://localhost:${env.port}`));
}
