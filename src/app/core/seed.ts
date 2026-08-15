import { Account, Category, Goal, Prefs, Subscription } from './models';

/** Just a sensible starting set of categories — everything else (accounts, transactions, subs, goals) starts empty. */
export const SEED_CATS: Category[] = [
  { id: 'comida', code: 'COM', name: 'Comida' },
  { id: 'transporte', code: 'TRA', name: 'Transporte' },
  { id: 'ocio', code: 'OCI', name: 'Ocio' },
  { id: 'subs', code: 'SUS', name: 'Suscrip.', kind: 'sub' },
  { id: 'fisico', code: 'FIS', name: 'Físico' },
  { id: 'hogar', code: 'HOG', name: 'Hogar' },
  { id: 'salud', code: 'SAL', name: 'Salud' },
];

export const SEED_IN_CATS: Category[] = [
  { id: 'sueldo', code: 'SUE', name: 'Sueldo' },
  { id: 'freelance', code: 'FRE', name: 'Freelance' },
  { id: 'venta', code: 'VEN', name: 'Venta' },
  { id: 'otro_in', code: 'OTR', name: 'Otro' },
];

export const SEED_ACCOUNTS: Account[] = [];
export const SEED_SUBS: Subscription[] = [];
export const SEED_GOALS: Goal[] = [];

export const SEED_PREFS: Prefs = { subs: true, alto: true, diario: true, weekGoal: 1200, notified: {} };
