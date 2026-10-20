jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
  inTransaction: jest.fn(),
  pool: { end: jest.fn() },
  checkDatabase: jest.fn()
}));

import request from 'supertest';
import app from '../src/app';
import { query } from '../src/db/pool';
import { rows } from './fixtures';

// Archivo independiente: el contador del limitador vive en memoria y no debe mezclarse con otras pruebas.
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('Límite de intentos de login (FR-004)', () => {
  test('bloquea con 429 después de 10 intentos fallidos', async () => {
    mockedQuery.mockResolvedValue(rows());
    const attempt = () => request(app).post('/api/v1/auth/login')
      .send({ organizationSlug: 'utmach', email: 'victima@example.test', password: 'adivinanza' });

    for (let i = 0; i < 10; i++) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
