import { Account, Category, Goal, Prefs, Subscription, Transaction } from './models';

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

export const SEED_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Nu', balance: 8420 },
  { id: 'a2', name: 'BBVA', balance: 15300 },
  { id: 'a3', name: 'Mercado Pago', balance: 2140 },
  { id: 'a4', name: 'Efectivo', balance: 860 },
];

export const SEED_SUBS: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 219, day: 17, cycle: 'Mensual', remind: 2 },
  { id: 's2', name: 'Spotify', amount: 129, day: 3, cycle: 'Mensual', remind: 2 },
  { id: 's3', name: 'iCloud 200 GB', amount: 49, day: 22, cycle: 'Mensual', remind: 1 },
  { id: 's4', name: 'Gimnasio', amount: 649, day: 1, cycle: 'Mensual', remind: 3 },
];

const y = new Date().getFullYear();

export const SEED_GOALS: Goal[] = [
  { id: 'g1', kind: 'ahorro', name: 'Auto', target: 60000, saved: 12400, date: `${y + 1}-06-01` },
  { id: 'g2', kind: 'ahorro', name: 'Fondo de emergencia', target: 45000, saved: 31200 },
  { id: 'g3', kind: 'ahorro', name: 'Ropa', target: 6000, saved: 1800 },
  { id: 'g4', kind: 'ahorro', name: 'Perfume', target: 4500, saved: 2900 },
  { id: 'g5', kind: 'deuda', name: 'Tarjeta BBVA', target: 12000, saved: 4500 },
  { id: 'l1', kind: 'limite', name: 'Comida', target: 4800, catId: 'comida' },
  { id: 'l2', kind: 'limite', name: 'Ocio', target: 2000, catId: 'ocio' },
  { id: 'l3', kind: 'diario', name: 'Tope del día', target: 600 },
];

export const SEED_PREFS: Prefs = { subs: true, alto: true, diario: true, weekGoal: 1200, notified: {} };

/** Small handful of starter transactions so the app isn't empty on first run. */
export function seedTransactions(): Transaction[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: Transaction[] = [];
  const notes: Record<string, string[]> = {
    comida: ['Súper', 'Comida corrida', 'Café', 'Tacos'],
    transporte: ['Metro', 'Uber', 'Gasolina'],
    ocio: ['Cine', 'Salida con amigos'],
    hogar: ['Luz', 'Internet'],
  };
  let seed = 918273645;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let d = 13; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    Object.keys(notes).forEach((cat) => {
      if (rnd() < 0.5) {
        const amount = Math.round(60 + rnd() * 300);
        const ts = new Date(day);
        ts.setHours(8 + Math.floor(rnd() * 13), Math.floor(rnd() * 60));
        out.push({
          id: 't' + out.length,
          type: 'gasto',
          catId: cat,
          amount,
          ts: +ts,
          note: notes[cat][Math.floor(rnd() * notes[cat].length)],
          acctId: 'a1',
        });
      }
    });
    if (day.getDate() === 1 || day.getDate() === 15) {
      const ts = new Date(day);
      ts.setHours(9, 5);
      out.push({ id: 'i' + +ts, type: 'ingreso', catId: 'sueldo', amount: 9800, ts: +ts, note: 'Quincena', acctId: 'a2' });
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}
