import { signSession } from '../src/auth/token';

export const ORG = '019a0000-0000-7000-8000-000000000001';
export const USER_ID = '019a0000-0000-7000-8000-000000000010';
export const TECH_ID = '019a0000-0000-7000-8000-000000000020';
export const REPORT_ID = '019a0000-0000-7000-8000-000000000100';
export const CATEGORY_ID = '019a0000-0000-7000-8000-000000001000';

export const userToken = () => signSession({ id: USER_ID, organizationId: ORG, role: 'USER' });
export const technicianToken = () => signSession({ id: TECH_ID, organizationId: ORG, role: 'TECHNICIAN' });

/** Simula una respuesta de `pg` con las filas indicadas. */
export const rows = (...items: object[]) => ({ rows: items, rowCount: items.length } as never);
