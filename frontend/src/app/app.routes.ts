import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login.component').then(m => m.LoginComponent) },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard('USER')],
    loadComponent: () => import('./features/reports/pages/user-reports.component').then(m => m.UserReportsComponent)
  },
  {
    path: 'technician/reports',
    canActivate: [authGuard, roleGuard('TECHNICIAN')],
    loadComponent: () => import('./features/reports/pages/technician-reports.component').then(m => m.TechnicianReportsComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'reports' },
  { path: '**', redirectTo: 'reports' }
];
