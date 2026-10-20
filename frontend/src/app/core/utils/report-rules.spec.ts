import { EDIT_WINDOW_MS, displayName, editTimeLeft, formatCountdown, initials, nextStatus, shortId } from './report-rules';

describe('report-rules', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const createdAgo = (ms: number) => new Date(now - ms).toISOString();

  describe('editTimeLeft (spec 002)', () => {
    it('devuelve el tiempo restante de un reporte abierto y sin técnico', () => {
      const left = editTimeLeft({ status: 'OPEN', technicianId: null, createdAt: createdAgo(60_000) }, now);
      expect(left).toBe(EDIT_WINDOW_MS - 60_000);
    });

    it('devuelve 0 cuando la ventana de 5 minutos expiró', () => {
      expect(editTimeLeft({ status: 'OPEN', technicianId: null, createdAt: createdAgo(EDIT_WINDOW_MS + 1) }, now)).toBe(0);
    });

    it('devuelve 0 si el reporte ya tiene técnico o cambió de estado', () => {
      expect(editTimeLeft({ status: 'OPEN', technicianId: 't-1', createdAt: createdAgo(0) }, now)).toBe(0);
      expect(editTimeLeft({ status: 'IN_PROGRESS', technicianId: null, createdAt: createdAgo(0) }, now)).toBe(0);
    });
  });

  it('sigue la máquina de estados OPEN → IN_PROGRESS → RESOLVED', () => {
    expect(nextStatus('OPEN')).toBe('IN_PROGRESS');
    expect(nextStatus('IN_PROGRESS')).toBe('RESOLVED');
    expect(nextStatus('RESOLVED')).toBeNull();
  });

  it('formatea la cuenta regresiva en m:ss', () => {
    expect(formatCountdown(4 * 60_000 + 5_000)).toBe('4:05');
    expect(formatCountdown(500)).toBe('0:01');
  });

  it('obtiene iniciales ignorando títulos y descripciones entre paréntesis', () => {
    expect(initials('Ing. María Rodríguez (Docente)')).toBe('MR');
    expect(initials('Carlos')).toBe('C');
    expect(initials('')).toBe('?');
    expect(displayName('Andrea Jaramillo (Técnico Redes)')).toBe('Andrea Jaramillo');
  });

  it('genera un identificador corto legible', () => {
    expect(shortId('019a0000-0000-7000-8000-00000000abcd')).toBe('#00ABCD');
  });
});
