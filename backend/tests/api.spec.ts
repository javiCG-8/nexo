jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
  inTransaction: jest.fn(),
  pool: { end: jest.fn() },
  checkDatabase: jest.fn()
}));

import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { query } from '../src/db/pool';
import { CATEGORY_ID, ORG, REPORT_ID, TECH_ID, USER_ID, rows, technicianToken, userToken } from './fixtures';

const mockedQuery = query as jest.MockedFunction<typeof query>;

const report = (overrides: object = {}) => ({
  id: REPORT_ID, organizationId: ORG, categoryId: CATEGORY_ID, status: 'OPEN', technicianId: null, ...overrides
});

beforeEach(() => mockedQuery.mockReset());

describe('Autenticación', () => {
  test('permite iniciar sesión y entrega la sesión en una cookie HttpOnly', async () => {
    mockedQuery.mockResolvedValueOnce(rows({
      id: USER_ID, organizationId: ORG, organizationSlug: 'utmach', name: 'Usuario', email: 'user@example.test',
      role: 'USER', password_hash: await bcrypt.hash('Nexo123!', 4)
    }));

    const response = await request(app).post('/api/v1/auth/login').send({
      organizationSlug: 'UTMACH', email: 'user@example.test', password: 'Nexo123!'
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(expect.objectContaining({ role: 'USER', organizationSlug: 'utmach' }));
    expect(response.body.token).toBeUndefined();
    expect(response.body.user.password_hash).toBeUndefined();
    expect(mockedQuery.mock.calls[0][1]).toEqual(['utmach', 'user@example.test']);
    const cookie = String(response.headers['set-cookie']);
    expect(cookie).toMatch(/^nexo_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api/);
  });

  test('responde lo mismo si el usuario no existe o la contraseña es incorrecta', async () => {
    mockedQuery.mockResolvedValueOnce(rows());
    const unknownUser = await request(app).post('/api/v1/auth/login').send({
      organizationSlug: 'utmach', email: 'nadie@example.test', password: 'x'
    });

    mockedQuery.mockResolvedValueOnce(rows({
      id: USER_ID, organizationId: ORG, role: 'USER', password_hash: await bcrypt.hash('otra', 4)
    }));
    const wrongPassword = await request(app).post('/api/v1/auth/login').send({
      organizationSlug: 'utmach', email: 'user@example.test', password: 'x'
    });

    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.body).toEqual(wrongPassword.body);
  });

  test('autentica con la cookie de sesión y devuelve el perfil', async () => {
    mockedQuery.mockResolvedValueOnce(rows({ id: USER_ID, organizationId: ORG, role: 'USER', name: 'Usuario' }));

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `nexo_session=${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(USER_ID);
    expect(mockedQuery.mock.calls[0][1]).toEqual([USER_ID, ORG]);
  });

  test('cierra sesión borrando la cookie', async () => {
    const response = await request(app).post('/api/v1/auth/logout');
    expect(response.status).toBe(204);
    expect(String(response.headers['set-cookie'])).toMatch(/nexo_session=;/);
  });

  test('rechaza peticiones sin token', async () => {
    const response = await request(app).get('/api/v1/reports');
    expect(response.status).toBe(401);
  });
});

describe('Creación y consulta de reportes (spec 001)', () => {
  test('crea un reporte usando una categoría activa de la organización', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows({ id: CATEGORY_ID }))
      .mockResolvedValueOnce(rows({ id: REPORT_ID }))
      .mockResolvedValueOnce(rows(report()));

    const response = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'Sin red', description: 'No hay conexión en el aula 204', categoryId: CATEGORY_ID, priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('OPEN');
    expect(response.body.organizationId).toBe(ORG);
  });

  test('rechaza un reporte con campos inválidos sin tocar la base de datos', async () => {
    const response = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: '', description: 'corta', categoryId: 'no-uuid', priority: 'URGENTE' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.map((d: { field: string }) => d.field))
      .toEqual(expect.arrayContaining(['title', 'description', 'categoryId', 'priority']));
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('aplica el aislamiento de organización al listar reportes', async () => {
    mockedQuery.mockResolvedValueOnce(rows());

    const response = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(mockedQuery.mock.calls[0][1]).toEqual([ORG, USER_ID]);
  });

  test('rechaza filtros fuera de catálogo', async () => {
    const response = await request(app)
      .get('/api/v1/reports?status=DELETED')
      .set('Authorization', `Bearer ${technicianToken()}`);

    expect(response.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('responde 400 ante un identificador que no es UUID', async () => {
    const response = await request(app)
      .get('/api/v1/reports/1%20OR%201=1')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('Asignación y estados (spec 001)', () => {
  test('rechaza la segunda asignación del mismo reporte', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows({ '?column?': 1 }));

    const response = await request(app)
      .patch(`/api/v1/reports/${REPORT_ID}/assignment`)
      .set('Authorization', `Bearer ${technicianToken()}`)
      .send({ assignToMe: true });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: { code: 'REPORT_ALREADY_ASSIGNED', message: 'El reporte ya fue asignado' }
    });
  });

  test('rechaza una transición de estado inválida', async () => {
    mockedQuery.mockResolvedValueOnce(rows({ status: 'OPEN' }));

    const response = await request(app)
      .patch(`/api/v1/reports/${REPORT_ID}/status`)
      .set('Authorization', `Bearer ${technicianToken()}`)
      .send({ status: 'RESOLVED', resolutionNotes: 'Se cambió el cable de red' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  test('impide que un usuario cambie el estado', async () => {
    const response = await request(app)
      .patch(`/api/v1/reports/${REPORT_ID}/status`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ status: 'IN_PROGRESS' });

    expect(response.status).toBe(403);
  });
});

describe('Ciclo de vida del reporte (spec 002)', () => {
  test('FR-001: el autor edita su reporte dentro de la ventana', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows({ id: REPORT_ID }))
      .mockResolvedValueOnce(rows(report({ title: 'Título corregido' })));

    const response = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'Título corregido' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Título corregido');
    const [sql, values] = mockedQuery.mock.calls[0];
    expect(sql).toContain('technician_id IS NULL');
    expect(sql).toContain('created_at >= now()');
    expect(values).toEqual(['Título corregido', null, null, null, REPORT_ID, ORG, USER_ID]);
  });

  test('FR-001: rechaza la edición cuando expiró la ventana de 5 minutos', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows({ status: 'OPEN', technicianId: null, withinWindow: false }));

    const response = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ priority: 'LOW' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EDIT_WINDOW_EXPIRED');
  });

  test('SC-002: rechaza la edición de un reporte ya asignado', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows({ status: 'OPEN', technicianId: TECH_ID, withinWindow: true }));

    const response = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ priority: 'LOW' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('REPORT_LOCKED');
  });

  test('FR-001: responde 404 si el reporte no pertenece al usuario', async () => {
    mockedQuery.mockResolvedValueOnce(rows()).mockResolvedValueOnce(rows());

    const response = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ priority: 'LOW' });

    expect(response.status).toBe(404);
  });

  test('rechaza una edición vacía o con campos desconocidos', async () => {
    const empty = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({});
    const unknown = await request(app)
      .put(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ status: 'RESOLVED' });

    expect(empty.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('FR-002: el autor cancela su reporte dentro de la ventana', async () => {
    mockedQuery.mockResolvedValueOnce(rows({ id: REPORT_ID }));

    const response = await request(app)
      .delete(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(REPORT_ID);
  });

  test('FR-002: rechaza cancelar un reporte en proceso', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows())
      .mockResolvedValueOnce(rows({ status: 'IN_PROGRESS', technicianId: TECH_ID, withinWindow: true }));

    const response = await request(app)
      .delete(`/api/v1/reports/${REPORT_ID}`)
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('REPORT_LOCKED');
  });

  test('FR-004: exige notas de solución al resolver', async () => {
    const response = await request(app)
      .patch(`/api/v1/reports/${REPORT_ID}/status`)
      .set('Authorization', `Bearer ${technicianToken()}`)
      .send({ status: 'RESOLVED' });

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('resolutionNotes');
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  test('FR-004: resuelve guardando las notas de solución', async () => {
    mockedQuery
      .mockResolvedValueOnce(rows({ status: 'IN_PROGRESS' }))
      .mockResolvedValueOnce(rows({ id: REPORT_ID }))
      .mockResolvedValueOnce(rows(report({ status: 'RESOLVED', resolutionNotes: 'Se cambió el cable de red' })));

    const response = await request(app)
      .patch(`/api/v1/reports/${REPORT_ID}/status`)
      .set('Authorization', `Bearer ${technicianToken()}`)
      .send({ status: 'RESOLVED', resolutionNotes: '  Se cambió el cable de red  ' });

    expect(response.status).toBe(200);
    expect(response.body.resolutionNotes).toBe('Se cambió el cable de red');
    expect(mockedQuery.mock.calls[1][1]).toEqual([
      'RESOLVED', 'Se cambió el cable de red', REPORT_ID, ORG, TECH_ID, 'IN_PROGRESS'
    ]);
  });
});
