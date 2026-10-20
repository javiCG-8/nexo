import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report, ReportPriority, ReportStatus } from '../models/report.model';
import { User } from '../models/user.model';
import { EDIT_WINDOW_MS, nextStatus } from '../utils/report-rules';
import { DEMO_CATEGORIES, DEMO_PASSWORD, DEMO_USERS, seedReports } from './demo-data';

/**
 * API simulada en memoria para la demo pública (GitHub Pages), donde no existe backend.
 * Reproduce las reglas de la API real (roles, aislamiento por organización, ventana de
 * edición de 5 minutos y máquina de estados) para que la demo sea fiel al sistema.
 * Solo se registra cuando `environment.demoMode` es true.
 */
const STORE_KEY = 'nexo_demo_reports';
const SESSION_KEY = 'nexo_demo_session';
const LATENCY_MS = 280;

const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento: la demo funciona igual, pero no persiste al recargar.
    }
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignorado
    }
  }
};

let reports: Report[] = [];
let loaded = false;

const save = () => storage.set(STORE_KEY, reports);
const currentUser = (): User | undefined => {
  const id = storage.get<string | null>(SESSION_KEY, null);
  return DEMO_USERS.find(user => user.id === id);
};

const ok = <T>(body: T, status = 200) => of(new HttpResponse<T>({ status, body })).pipe(delay(LATENCY_MS));
const fail = (url: string, status: number, code: string, message: string) =>
  throwError(() => new HttpErrorResponse({ url, status, error: { error: { code, message } } })).pipe(
    delay(LATENCY_MS)
  );

function enrich(report: Report): Report {
  const category = DEMO_CATEGORIES.find(c => c.id === report.categoryId);
  return {
    ...report,
    categoryCode: category?.code ?? '',
    categoryName: category?.name ?? '',
    reporterName: DEMO_USERS.find(u => u.id === report.reporterId)?.name ?? '',
    technicianName: DEMO_USERS.find(u => u.id === report.technicianId)?.name ?? null
  };
}

function validReportBody(body: Partial<Report>, partial: boolean): string | null {
  const priorities: ReportPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const has = (key: keyof Report) => body[key] !== undefined;
  if (!partial || has('title')) {
    const title = String(body.title ?? '').trim();
    if (title.length < 3 || title.length > 150) return 'El título debe tener entre 3 y 150 caracteres';
  }
  if (!partial || has('description')) {
    const description = String(body.description ?? '').trim();
    if (description.length < 10) return 'La descripción debe tener al menos 10 caracteres';
  }
  if ((!partial || has('priority')) && !priorities.includes(body.priority as ReportPriority)) return 'Prioridad no válida';
  if ((!partial || has('categoryId')) && !DEMO_CATEGORIES.some(c => c.id === body.categoryId)) return 'Categoría no válida';
  return null;
}

function handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const path = req.url.slice(environment.apiUrl.length);
  const body = (req.body ?? {}) as Record<string, unknown>;
  const user = currentUser();
  if (!loaded) {
    reports = storage.get<Report[]>(STORE_KEY, []);
    if (reports.length === 0) reports = seedReports();
    loaded = true;
  }

  // ----- Autenticación -----
  if (path === '/auth/login' && req.method === 'POST') {
    const match = DEMO_USERS.find(
      u =>
        u.organizationSlug === String(body['organizationSlug']).trim().toLowerCase() &&
        u.email === String(body['email']).trim().toLowerCase()
    );
    if (!match || body['password'] !== DEMO_PASSWORD) {
      return fail(req.url, 401, 'AUTHENTICATION_FAILED', 'Credenciales inválidas');
    }
    storage.set(SESSION_KEY, match.id);
    return ok({ user: match });
  }
  if (path === '/auth/logout') {
    storage.remove(SESSION_KEY);
    return ok(null, 204);
  }
  if (!user) return fail(req.url, 401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación');
  if (path === '/auth/me') return ok({ user });

  // ----- Catálogo -----
  if (path === '/categories') {
    return ok({ items: DEMO_CATEGORIES.filter(c => c.organizationId === user.organizationId) });
  }

  // ----- Reportes -----
  const visible = reports.filter(
    r => r.organizationId === user.organizationId && (user.role === 'TECHNICIAN' || r.reporterId === user.id)
  );
  const [, , id, action] = path.split('/');
  const target = id ? visible.find(r => r.id === id) : undefined;

  if (path === '/reports' && req.method === 'GET') {
    return ok({ items: [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(enrich) });
  }

  if (path === '/reports' && req.method === 'POST') {
    if (user.role !== 'USER') return fail(req.url, 403, 'FORBIDDEN', 'No tienes permisos para esta operación');
    const invalid = validReportBody(body as Partial<Report>, false);
    if (invalid) return fail(req.url, 400, 'VALIDATION_ERROR', invalid);
    const now = new Date().toISOString();
    const created: Report = enrich({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      title: String(body['title']).trim(),
      description: String(body['description']).trim(),
      resolutionNotes: null,
      categoryId: String(body['categoryId']),
      categoryCode: '',
      categoryName: '',
      priority: body['priority'] as ReportPriority,
      status: 'OPEN',
      reporterId: user.id,
      reporterName: '',
      technicianId: null,
      technicianName: null,
      createdAt: now,
      updatedAt: now
    });
    reports = [created, ...reports];
    save();
    return ok(created, 201);
  }

  if (!target) return fail(req.url, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');

  const update = (changes: Partial<Report>) => {
    const updated = enrich({ ...target, ...changes, updatedAt: new Date().toISOString() });
    reports = reports.map(r => (r.id === target.id ? updated : r));
    save();
    return ok(updated);
  };

  const lockReason = () => {
    if (target.status !== 'OPEN' || target.technicianId) {
      return fail(req.url, 409, 'REPORT_LOCKED', 'No se puede modificar un reporte que ya está en atención o resuelto');
    }
    if (Date.now() - new Date(target.createdAt).getTime() > EDIT_WINDOW_MS) {
      return fail(req.url, 409, 'EDIT_WINDOW_EXPIRED', 'El periodo de 5 minutos ha expirado');
    }
    return null;
  };

  if (!action && req.method === 'GET') return ok(enrich(target));

  if (!action && (req.method === 'PUT' || req.method === 'DELETE')) {
    if (user.role !== 'USER') return fail(req.url, 403, 'FORBIDDEN', 'No tienes permisos para esta operación');
    const locked = lockReason();
    if (locked) return locked;
    if (req.method === 'DELETE') {
      reports = reports.filter(r => r.id !== target.id);
      save();
      return ok({ message: 'Reporte cancelado correctamente', id: target.id });
    }
    const invalid = validReportBody(body as Partial<Report>, true);
    if (invalid) return fail(req.url, 400, 'VALIDATION_ERROR', invalid);
    return update({
      title: String(body['title'] ?? target.title).trim(),
      description: String(body['description'] ?? target.description).trim(),
      categoryId: String(body['categoryId'] ?? target.categoryId),
      priority: (body['priority'] as ReportPriority) ?? target.priority
    });
  }

  if (user.role !== 'TECHNICIAN') return fail(req.url, 403, 'FORBIDDEN', 'No tienes permisos para esta operación');

  if (action === 'assignment') {
    if (target.technicianId) return fail(req.url, 409, 'REPORT_ALREADY_ASSIGNED', 'El reporte ya fue asignado');
    return update({ technicianId: user.id });
  }

  if (action === 'status') {
    if (target.technicianId !== user.id) return fail(req.url, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
    const status = body['status'] as ReportStatus;
    if (nextStatus(target.status) !== status) {
      return fail(req.url, 409, 'INVALID_STATUS_TRANSITION', 'La transición de estado no es válida');
    }
    const notes = String(body['resolutionNotes'] ?? '').trim();
    if (status === 'RESOLVED' && (notes.length < 5 || notes.length > 2000)) {
      return fail(req.url, 400, 'VALIDATION_ERROR', 'Las notas de solución son obligatorias al resolver');
    }
    return update({ status, resolutionNotes: status === 'RESOLVED' ? notes : target.resolutionNotes });
  }

  return fail(req.url, 404, 'NOT_FOUND', 'Recurso no encontrado');
}

export const demoBackendInterceptor: HttpInterceptorFn = (req, next) =>
  req.url.startsWith(environment.apiUrl) ? handle(req) : next(req);
