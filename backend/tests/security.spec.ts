jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
  inTransaction: jest.fn(),
  pool: { end: jest.fn() },
  checkDatabase: jest.fn()
}));

import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app';
import { checkDatabase, query } from '../src/db/pool';
import { ORG, USER_ID, rows, userToken } from './fixtures';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const SECRET = process.env.AUTH_SECRET!;

beforeEach(() => mockedQuery.mockReset());

describe('Tokens JWT (FR-003)', () => {
  const claims = { org: ORG, role: 'USER' };

  test.each([
    ['sin emisor ni audiencia', () => jwt.sign(claims, SECRET, { subject: USER_ID })],
    ['con otro emisor', () => jwt.sign(claims, SECRET, { subject: USER_ID, issuer: 'otro', audience: 'nexo-web' })],
    ['firmado con otro secreto', () => jwt.sign(claims, 'x'.repeat(40), { subject: USER_ID, issuer: 'nexo-api', audience: 'nexo-web' })],
    ['expirado', () => jwt.sign(claims, SECRET, { subject: USER_ID, issuer: 'nexo-api', audience: 'nexo-web', expiresIn: -10 })],
    ['con algoritmo none', () => jwt.sign(claims, '', { subject: USER_ID, issuer: 'nexo-api', audience: 'nexo-web', algorithm: 'none' })],
    ['con un rol inexistente', () => jwt.sign({ org: ORG, role: 'ADMIN' }, SECRET, { subject: USER_ID, issuer: 'nexo-api', audience: 'nexo-web' })]
  ])('rechaza un token %s', async (_name, makeToken) => {
    const response = await request(app).get('/api/v1/reports').set('Authorization', `Bearer ${makeToken()}`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('Cabeceras y CORS (FR-007)', () => {
  test('aplica cabeceras de seguridad y oculta la tecnología del servidor', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  test('solo permite el origen configurado y con credenciales', async () => {
    const allowed = await request(app).options('/api/v1/reports')
      .set('Origin', 'http://localhost:4200').set('Access-Control-Request-Method', 'POST');
    const denied = await request(app).options('/api/v1/reports')
      .set('Origin', 'https://atacante.example').set('Access-Control-Request-Method', 'POST');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(denied.headers['access-control-allow-origin']).not.toBe('https://atacante.example');
  });
});

describe('Entrada malformada (FR-008, FR-009)', () => {
  test('rechaza cuerpos que no son JSON en peticiones que modifican estado (anti-CSRF)', async () => {
    const response = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', `nexo_session=${userToken()}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('title=x');

    expect(response.status).toBe(415);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('responde 400 ante JSON malformado', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  test('responde 413 ante un cuerpo mayor a 10 kB', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ organizationSlug: 'utmach', email: 'a@b.co', password: 'x'.repeat(11_000) });

    expect(response.status).toBe(413);
  });

  test('rechaza campos desconocidos en el login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ organizationSlug: 'utmach', email: 'a@b.co', password: 'x', role: 'TECHNICIAN' });

    expect(response.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('responde 404 en JSON para rutas inexistentes', async () => {
    const response = await request(app).get('/api/v1/no-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('no expone detalles internos ante un error inesperado', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedQuery.mockRejectedValueOnce(new Error('relation "reports" does not exist'));

    const response = await request(app).get('/api/v1/reports').set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('relation');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('Disponibilidad', () => {
  test('informa 503 cuando la base de datos no responde', async () => {
    (checkDatabase as jest.Mock).mockResolvedValueOnce(false);
    const response = await request(app).get('/api/v1/health/ready');
    expect(response.status).toBe(503);
  });
});
