import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/today').then(m => m.TodayPage), title: 'Hoy' },
  { path: 'entreno', loadComponent: () => import('./pages/session').then(m => m.SessionPage), title: 'Entreno' },
  { path: 'resumen', loadComponent: () => import('./pages/summary').then(m => m.SummaryPage), title: 'Resumen' },
  { path: 'calendario', loadComponent: () => import('./pages/calendar').then(m => m.CalendarPage), title: 'Calendario' },
  { path: 'progreso', loadComponent: () => import('./pages/progress').then(m => m.ProgressPage), title: 'Progreso' },
  { path: 'plan', loadComponent: () => import('./pages/plan').then(m => m.PlanPage), title: 'Plan' },
  { path: 'editor', loadComponent: () => import('./pages/editor').then(m => m.EditorPage), title: 'Editor' },
  { path: '**', redirectTo: '' },
];
