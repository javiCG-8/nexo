import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeRedirect, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Nexo',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'reports',
        title: 'Mis reportes · Nexo',
        canActivate: [roleGuard('USER')],
        loadComponent: () => import('./features/reports/pages/user-reports.page').then(m => m.UserReportsPage)
      },
      {
        path: 'technician/reports',
        title: 'Bandeja técnica · Nexo',
        canActivate: [roleGuard('TECHNICIAN')],
        loadComponent: () =>
          import('./features/reports/pages/technician-reports.page').then(m => m.TechnicianReportsPage)
      },
      { path: '', pathMatch: 'full', redirectTo: homeRedirect }
    ]
  },
  { path: '**', redirectTo: homeRedirect }
];
