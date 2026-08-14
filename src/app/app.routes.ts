import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', data: { title: 'Inicio' }, loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio) },
  { path: 'gastos', data: { title: 'Gastos' }, loadComponent: () => import('./pages/gastos/gastos').then((m) => m.Gastos) },
  { path: 'ahorro', data: { title: 'Ahorro' }, loadComponent: () => import('./pages/ahorro/ahorro').then((m) => m.Ahorro) },
  { path: 'saldo', data: { title: 'Saldo' }, loadComponent: () => import('./pages/saldo/saldo').then((m) => m.Saldo) },
  { path: 'subs', data: { title: 'Subs' }, loadComponent: () => import('./pages/subs/subs').then((m) => m.Subs) },
  { path: 'avisos', data: { title: 'Avisos' }, loadComponent: () => import('./pages/avisos/avisos').then((m) => m.Avisos) },
  { path: '**', redirectTo: '' },
];
