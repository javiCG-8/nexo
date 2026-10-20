import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Report } from '../models/report.model';
import { demoBackendInterceptor } from './demo-backend.interceptor';

/** La API simulada de la demo pública debe respetar las mismas reglas que la API real. */
describe('demoBackendInterceptor', () => {
  let http: HttpClient;
  const api = environment.apiUrl;
  const call = <T>(request: () => import('rxjs').Observable<T>) => firstValueFrom(request());
  const errorCode = async (request: () => import('rxjs').Observable<unknown>) => {
    try {
      await call(request);
      return 'OK';
    } catch (error) {
      return (error as HttpErrorResponse).error.error.code as string;
    }
  };
  const login = (email: string) =>
    call(() => http.post(`${api}/auth/login`, { organizationSlug: 'utmach', email, password: 'Nexo123!' }));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([demoBackendInterceptor]))] });
    http = TestBed.inject(HttpClient);
  });

  it('rechaza credenciales incorrectas y exige sesión', async () => {
    expect(await errorCode(() => http.post(`${api}/auth/login`, { organizationSlug: 'utmach', email: 'user@example.test', password: 'x' })))
      .toBe('AUTHENTICATION_FAILED');
    expect(await errorCode(() => http.get(`${api}/reports`))).toBe('AUTHENTICATION_REQUIRED');
  });

  it('un usuario solo ve sus propios reportes', async () => {
    await login('user@example.test');
    const { items } = await call(() => http.get<{ items: Report[] }>(`${api}/reports`));
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(r => r.reporterId === 'u-carlos')).toBe(true);
  });

  it('impide editar un reporte asignado y exige notas al resolver', async () => {
    await login('user@example.test');
    expect(await errorCode(() => http.put(`${api}/reports/r-1`, { priority: 'LOW' }))).toBe('REPORT_LOCKED');

    await login('tech@example.test');
    expect(await errorCode(() => http.patch(`${api}/reports/r-5/status`, { status: 'IN_PROGRESS' }))).toBe('OK');
    expect(await errorCode(() => http.patch(`${api}/reports/r-5/status`, { status: 'RESOLVED' }))).toBe('VALIDATION_ERROR');
    expect(await errorCode(() => http.patch(`${api}/reports/r-5/status`, { status: 'RESOLVED', resolutionNotes: 'Cable HDMI reemplazado' })))
      .toBe('OK');
    expect(await errorCode(() => http.patch(`${api}/reports/r-2/assignment`, { assignToMe: true }))).toBe('OK');
    expect(await errorCode(() => http.patch(`${api}/reports/r-2/assignment`, { assignToMe: true }))).toBe('REPORT_ALREADY_ASSIGNED');
  });
});
