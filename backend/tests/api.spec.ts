process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nexobd';
process.env.AUTH_SECRET = 'test-secret';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.PORT = '3000';

jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
  inTransaction: jest.fn(),
  pool: { end: jest.fn() }
}));

import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { inTransaction, query } from '../src/db/pool';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedTransaction = inTransaction as jest.MockedFunction<typeof inTransaction>;
const userToken = () => jwt.sign(
  { id: 'user-a', organizationId: 'org-a', role: 'USER', name: 'Usuario', email: 'user@example.test' },
  'test-secret'
);
const technicianToken = () => jwt.sign(
  { id: 'tech-a', organizationId: 'org-a', role: 'TECHNICIAN', name: 'Técnico', email: 'tech@example.test' },
  'test-secret'
);

beforeEach(() => {
  mockedQuery.mockReset();
  mockedTransaction.mockReset();
});

afterAll(async () => {
  const { pool } = await import('../src/db/pool');
  await pool.end();
});

test('permite iniciar sesión con credenciales válidas', async () => {
  mockedQuery.mockResolvedValueOnce({
    rows: [{
      id: 'user-a', organizationId: 'org-a', name: 'Usuario', email: 'user@example.test',
      role: 'USER', password_hash: await bcrypt.hash('Nexo123!', 4)
    }],
    rowCount: 1,
    command: 'SELECT',
    oid: 0,
    fields: []
  } as never);

  const response = await request(app).post('/api/v1/auth/login').send({
    organizationSlug: 'org-a',
    email: 'user@example.test',
    password: 'Nexo123!'
  });

  expect(response.status).toBe(200);
  expect(response.body.user.role).toBe('USER');
  expect(response.body.token).toBeDefined();
});

test('crea un reporte usando una categoría activa de la organización', async () => {
  mockedQuery
    .mockResolvedValueOnce({ rows: [{ id: 'cat-network' }], rowCount: 1 } as never)
    .mockResolvedValueOnce({
      rows: [{ id: 'report-1', organizationId: 'org-a', categoryId: 'cat-network', status: 'OPEN', technicianId: null }],
      rowCount: 1
    } as never);

  const response = await request(app)
    .post('/api/v1/reports')
    .set('Authorization', `Bearer ${userToken()}`)
    .send({ title: 'Sin red', description: 'No hay conexión', categoryId: 'cat-network', priority: 'HIGH' });

  expect(response.status).toBe(201);
  expect(response.body.status).toBe('OPEN');
  expect(response.body.organizationId).toBe('org-a');
});

test('aplica el aislamiento de organización al listar reportes', async () => {
  mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

  const response = await request(app)
    .get('/api/v1/reports')
    .set('Authorization', `Bearer ${userToken()}`);

  expect(response.status).toBe(200);
  expect(response.body.items).toEqual([]);
  expect(mockedQuery.mock.calls[0][1]).toEqual(['org-a', 'user-a']);
});

test('rechaza la segunda asignación del mismo reporte', async () => {
  mockedTransaction.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
  mockedQuery.mockResolvedValueOnce({ rows: [{ id: 'report-1' }], rowCount: 1 } as never);

  const response = await request(app)
    .patch('/api/v1/reports/report-1/assignment')
    .set('Authorization', `Bearer ${technicianToken()}`)
    .send({ assignToMe: true });

  expect(response.status).toBe(409);
  expect(response.body).toEqual({
    error: { code: 'REPORT_ALREADY_ASSIGNED', message: 'El reporte ya fue asignado' }
  });
});

test('rechaza una transición de estado inválida', async () => {
  mockedQuery.mockResolvedValueOnce({ rows: [{ status: 'OPEN' }], rowCount: 1 } as never);

  const response = await request(app)
    .patch('/api/v1/reports/report-1/status')
    .set('Authorization', `Bearer ${technicianToken()}`)
    .send({ status: 'RESOLVED' });

  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
});
