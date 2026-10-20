import { Report, ReportPriority, ReportStatus } from '../models/report.model';

/** Debe coincidir con EDIT_WINDOW_MINUTES de la API (spec 002). El servidor tiene la última palabra. */
export const EDIT_WINDOW_MS = 5 * 60 * 1000;

export const STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto'
};

export const PRIORITY_LABEL: Record<ReportPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
};

export const PRIORITY_HINT: Record<ReportPriority, string> = {
  LOW: 'Puede esperar, no bloquea el trabajo',
  MEDIUM: 'Afecta el trabajo, pero hay alternativa',
  HIGH: 'Bloquea a una persona o equipo',
  CRITICAL: 'Detiene un área o servicio completo'
};

export const PRIORITY_LEVEL: Record<ReportPriority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
export const STATUS_ORDER: Record<ReportStatus, number> = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2 };

export const PRIORITIES: ReportPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const STATUSES: ReportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

export function nextStatus(status: ReportStatus): ReportStatus | null {
  return status === 'OPEN' ? 'IN_PROGRESS' : status === 'IN_PROGRESS' ? 'RESOLVED' : null;
}

/** Milisegundos que le quedan al autor para editar o cancelar; 0 si ya no puede. */
export function editTimeLeft(
  report: Pick<Report, 'status' | 'technicianId' | 'createdAt'>,
  now: number
): number {
  if (report.status !== 'OPEN' || report.technicianId) return 0;
  return Math.max(0, new Date(report.createdAt).getTime() + EDIT_WINDOW_MS - now);
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function relativeTime(iso: string, now: number): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'justo ahora';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function shortId(id: string): string {
  return `#${id.replace(/-/g, '').slice(-6).toUpperCase()}`;
}

/** Nombre sin el paréntesis descriptivo de los datos de prueba: "Ana (Docente)" → "Ana". */
export function displayName(name: string | null | undefined): string {
  return (name ?? '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
}

export function initials(name: string | null | undefined): string {
  const words = displayName(name)
    .split(/\s+/)
    .filter(word => /^\p{L}/u.test(word) && !/^(ing|dr|dra|lic)\.?$/i.test(word));
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function apiErrorMessage(error: unknown, fallback = 'No fue posible completar la operación.'): string {
  const body = (error as { error?: { error?: { message?: string } } } | null)?.error;
  return body?.error?.message ?? fallback;
}
