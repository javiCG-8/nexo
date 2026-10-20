import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ActivatedRouteSnapshot, provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { demoBackendInterceptor } from './core/demo/demo-backend.interceptor';
import { SessionService } from './core/services/session.service';
import { ThemeService } from './core/services/theme.service';

/** Ruta hoja activa: permite omitir la animación cuando solo cambian los parámetros de consulta. */
const leaf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leaf(snapshot.firstChild) : snapshot;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          if (leaf(from).routeConfig === leaf(to).routeConfig) transition.skipTransition();
        }
      })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors(environment.demoMode ? [apiInterceptor, demoBackendInterceptor] : [apiInterceptor])
    ),
    provideAppInitializer(() => {
      inject(ThemeService);
      return inject(SessionService).restore();
    })
  ]
};
