import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { User } from '../models/user.model';
import { SessionService } from '../services/session.service';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { safeRedirect } from '../../features/auth/pages/login.page';

const technician: User = {
  id: 't-1', organizationId: 'o-1', organizationSlug: 'utmach', name: 'Técnico', email: 't@x.test', role: 'TECHNICIAN'
};

describe('Guards de ruta (spec 003, FR-011)', () => {
  let session: SessionService;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/reports' } as RouterStateSnapshot;
  const run = <T>(guard: () => T) => TestBed.runInInjectionContext(guard);
  const asUrl = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    session = TestBed.inject(SessionService);
  });

  it('envía al login (recordando la ruta) si no hay sesión', () => {
    expect(asUrl(run(() => authGuard(route, state)))).toBe('/login?next=%2Freports');
  });

  it('redirige a un técnico a SU inicio en lugar de crear un bucle', () => {
    session.user.set(technician);
    expect(asUrl(run(() => roleGuard('USER')(route, state)))).toBe('/technician/reports');
    expect(run(() => roleGuard('TECHNICIAN')(route, state))).toBe(true);
  });

  it('impide volver al login con una sesión activa', () => {
    session.user.set(technician);
    expect(asUrl(run(() => guestGuard(route, state)))).toBe('/technician/reports');
  });

  it('solo acepta redirecciones internas tras el login (evita open redirect)', () => {
    expect(safeRedirect('/reports')).toBe('/reports');
    expect(safeRedirect('//evil.example')).toBeNull();
    expect(safeRedirect('/\\evil.example')).toBeNull();
    expect(safeRedirect('https://evil.example')).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
  });
});
