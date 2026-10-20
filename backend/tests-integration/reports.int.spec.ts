import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/db/pool';

/**
 * Flujo completo contra PostgreSQL real: verifica que las reglas de negocio se cumplen
 * también en la base de datos (claves foráneas por organización, CHECK y SQL atómico).
 */
const sql = (file: string) => fs.readFileSync(path.join(__dirname, '..', 'db', file), 'utf8');
const PASSWORD = 'Nexo123!';

async function signIn(organizationSlug: string, email: string) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/login').send({ organizationSlug, email, password: PASSWORD });
  expect(response.status).toBe(200);
  return agent;
}

let networkCategoryId: string;
let reportId: string;

beforeAll(async () => {
  await pool.query('DROP TABLE IF EXISTS reports, categories, users, organizations CASCADE');
  await pool.query(sql('schema.sql'));
  await pool.query(sql('migrations/002_resolution_notes.sql'));
  await pool.query(sql('seed.sql'));
  await pool.query(sql('seed.sql')); // idempotencia

  const category = await pool.query<{ id: string }>(
    `SELECT c.id FROM categories c JOIN organizations o ON o.id = c.organization_id
     WHERE o.slug = 'utmach' AND c.code = 'NETWORK'`
  );
  networkCategoryId = category.rows[0].id;
});

afterAll(() => pool.end());

describe('Datos iniciales', () => {
  test('el seed es idempotente', async () => {
    const counts = await pool.query<{ users: string; reports: string }>(
      'SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM reports) AS reports'
    );
    expect(Number(counts.rows[0].users)).toBe(7);
    expect(Number(counts.rows[0].reports)).toBe(6);
  });

  test('la base rechaza notas de solución fuera de rango (CHECK)', async () => {
    await expect(pool.query(`UPDATE reports SET resolution_notes = 'x'`)).rejects.toThrow(/resolution_notes/);
  });

  test('/health/ready confirma la conexión', async () => {
    const response = await request(app).get('/api/v1/health/ready');
    expect(response.body).toEqual({ status: 'ok', database: true });
  });
});

describe('Ciclo de vida completo de un reporte', () => {
  test('el usuario crea un reporte y solo ve los suyos', async () => {
    const user = await signIn('utmach', 'user@example.test');
    const created = await user.post('/api/v1/reports').send({
      title: 'Switch del laboratorio 4 apagado',
      description: 'Ningún equipo del laboratorio tiene red desde las 10:00.',
      categoryId: networkCategoryId,
      priority: 'HIGH'
    });
    expect(created.status).toBe(201);
    expect(created.body).toEqual(expect.objectContaining({ status: 'OPEN', technicianId: null, categoryCode: 'NETWORK' }));
    reportId = created.body.id;

    const list = await user.get('/api/v1/reports');
    const reporters = new Set(list.body.items.map((r: { reporterId: string }) => r.reporterId));
    expect(reporters.size).toBe(1);
  });

  test('el usuario edita dentro de la ventana de 5 minutos', async () => {
    const user = await signIn('utmach', 'user@example.test');
    const response = await user.put(`/api/v1/reports/${reportId}`).send({ priority: 'CRITICAL' });
    expect(response.status).toBe(200);
    expect(response.body.priority).toBe('CRITICAL');
  });

  test('un técnico de otra organización no puede ver el reporte', async () => {
    const outsider = await signIn('techcorp', 'alex.valdez@techcorp.io');
    expect((await outsider.get(`/api/v1/reports/${reportId}`)).status).toBe(404);
    expect((await outsider.patch(`/api/v1/reports/${reportId}/assignment`).send({ assignToMe: true })).status).toBe(404);
  });

  test('el técnico se asigna; un segundo técnico no puede', async () => {
    const technician = await signIn('utmach', 'tech@example.test');
    const other = await signIn('utmach', 'andrea.jaramillo@utmach.edu.ec');

    const [first, second] = await Promise.all([
      technician.patch(`/api/v1/reports/${reportId}/assignment`).send({ assignToMe: true }),
      other.patch(`/api/v1/reports/${reportId}/assignment`).send({ assignToMe: true })
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = first.status === 200 ? technician : other;
    const loser = first.status === 200 ? other : technician;
    expect((await loser.patch(`/api/v1/reports/${reportId}/status`).send({ status: 'IN_PROGRESS' })).status).toBe(404);
    expect((await winner.patch(`/api/v1/reports/${reportId}/status`).send({ status: 'IN_PROGRESS' })).status).toBe(200);
  });

  test('el usuario ya no puede editar ni cancelar un reporte en atención', async () => {
    const user = await signIn('utmach', 'user@example.test');
    const edit = await user.put(`/api/v1/reports/${reportId}`).send({ priority: 'LOW' });
    const cancel = await user.delete(`/api/v1/reports/${reportId}`);
    expect(edit.body.error.code).toBe('REPORT_LOCKED');
    expect(cancel.body.error.code).toBe('REPORT_LOCKED');
  });

  test('resolver exige notas y el usuario las ve', async () => {
    const { rows } = await pool.query<{ email: string }>(
      'SELECT u.email FROM reports r JOIN users u ON u.id = r.technician_id WHERE r.id = $1',
      [reportId]
    );
    const technician = await signIn('utmach', rows[0].email);

    expect((await technician.patch(`/api/v1/reports/${reportId}/status`).send({ status: 'RESOLVED' })).status).toBe(400);
    const resolved = await technician
      .patch(`/api/v1/reports/${reportId}/status`)
      .send({ status: 'RESOLVED', resolutionNotes: 'Se reinició el switch y se reemplazó la fuente de poder.' });
    expect(resolved.status).toBe(200);

    const user = await signIn('utmach', 'user@example.test');
    const detail = await user.get(`/api/v1/reports/${reportId}`);
    expect(detail.body.status).toBe('RESOLVED');
    expect(detail.body.resolutionNotes).toMatch(/fuente de poder/);
  });
});

describe('Ventana de edición evaluada por PostgreSQL', () => {
  test('rechaza editar y cancelar cuando el reporte tiene más de 5 minutos', async () => {
    const user = await signIn('utmach', 'user@example.test');
    const created = await user.post('/api/v1/reports').send({
      title: 'Mouse inalámbrico sin respuesta',
      description: 'El mouse del aula 105 no responde aunque se cambiaron las pilas.',
      categoryId: networkCategoryId,
      priority: 'LOW'
    });
    await pool.query(`UPDATE reports SET created_at = now() - interval '6 minutes' WHERE id = $1`, [created.body.id]);

    const edit = await user.put(`/api/v1/reports/${created.body.id}`).send({ title: 'Mouse sin respuesta' });
    const cancel = await user.delete(`/api/v1/reports/${created.body.id}`);
    expect(edit.body.error.code).toBe('EDIT_WINDOW_EXPIRED');
    expect(cancel.body.error.code).toBe('EDIT_WINDOW_EXPIRED');
  });
});
