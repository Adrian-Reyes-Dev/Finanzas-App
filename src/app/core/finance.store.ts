import { Injectable, computed, signal } from '@angular/core';
import { db } from './db';
import { fmt } from './format';
import { Account, Category, DateRange, Goal, GoalKind, Prefs, Subscription, TxType, Transaction } from './models';
import { NotificationService } from './notification.service';
import { SEED_ACCOUNTS, SEED_CATS, SEED_GOALS, SEED_IN_CATS, SEED_PREFS, SEED_SUBS } from './seed';

export type Period = 'dia' | 'semana' | 'mes' | 'anio';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class FinanceStore {
  constructor(private notif: NotificationService) {}

  readonly cats = signal<Category[]>([]);
  readonly inCats = signal<Category[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly tx = signal<Transaction[]>([]);
  readonly subs = signal<Subscription[]>([]);
  readonly goals = signal<Goal[]>([]);
  readonly prefs = signal<Prefs>(SEED_PREFS);
  readonly ready = signal(false);

  readonly period = signal<Period>('mes');
  readonly weekGoal = computed(() => this.prefs().weekGoal);

  readonly available = computed(() => this.accounts().reduce((a, x) => a + x.balance, 0));
  readonly savedAll = computed(() =>
    this.goals()
      .filter((g) => g.kind === 'ahorro')
      .reduce((a, g) => a + (g.saved ?? 0), 0),
  );

  private ready$: Promise<void> | null = null;

  /** Loads (and seeds on first run) all tables from IndexedDB into signals. */
  init(): Promise<void> {
    if (!this.ready$) this.ready$ = this.load();
    return this.ready$;
  }

  private async load(): Promise<void> {
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    if ((await db.cats.count()) === 0) await this.seedFresh();
    await this.reloadAll();
    this.ready.set(true);
  }

  private async seedFresh(): Promise<void> {
    await db.transaction('rw', [db.cats, db.inCats, db.accounts, db.tx, db.subs, db.goals, db.prefs], async () => {
      await db.cats.bulkAdd(SEED_CATS);
      await db.inCats.bulkAdd(SEED_IN_CATS);
      await db.accounts.bulkAdd(SEED_ACCOUNTS);
      await db.subs.bulkAdd(SEED_SUBS);
      await db.goals.bulkAdd(SEED_GOALS);
      await db.prefs.put({ id: 'default', ...SEED_PREFS });
    });
  }

  /** Wipes every local table and starts over with a clean set of default categories — everything else empty. */
  async wipeAll(): Promise<void> {
    await db.transaction('rw', [db.cats, db.inCats, db.accounts, db.tx, db.subs, db.goals, db.prefs], async () => {
      await Promise.all([db.cats.clear(), db.inCats.clear(), db.accounts.clear(), db.tx.clear(), db.subs.clear(), db.goals.clear(), db.prefs.clear()]);
      await this.seedFresh();
    });
    await this.reloadAll();
  }

  private async reloadAll(): Promise<void> {
    const [cats, inCats, accounts, tx, subs, goals, prefsRow] = await Promise.all([
      db.cats.toArray(),
      db.inCats.toArray(),
      db.accounts.toArray(),
      db.tx.orderBy('ts').reverse().toArray(),
      db.subs.toArray(),
      db.goals.toArray(),
      db.prefs.get('default'),
    ]);
    this.cats.set(cats);
    this.inCats.set(inCats);
    this.accounts.set(accounts);
    this.tx.set(tx);
    this.subs.set(subs);
    this.goals.set(goals);
    if (prefsRow) this.prefs.set({ ...SEED_PREFS, ...prefsRow });
  }

  /* ── date ranges ── */
  static today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  range(period: Period): DateRange {
    const t = FinanceStore.today();
    let start = new Date(t);
    const end = new Date(t);
    end.setDate(end.getDate() + 1);
    if (period === 'semana') {
      start.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    } else if (period === 'mes') {
      start = new Date(t.getFullYear(), t.getMonth(), 1);
    } else if (period === 'anio') {
      start = new Date(t.getFullYear(), 0, 1);
    }
    return { start: +start, end: +end };
  }

  inRange(r: DateRange): Transaction[] {
    return this.tx().filter((t) => t.ts >= r.start && t.ts < r.end);
  }
  spent(r: DateRange): number {
    return this.inRange(r).reduce((a, t) => (t.type === 'gasto' ? a + t.amount : a), 0);
  }
  income(r: DateRange): number {
    return this.inRange(r).reduce((a, t) => (t.type === 'ingreso' ? a + t.amount : a), 0);
  }
  savedIn(r: DateRange): number {
    return this.inRange(r).reduce((a, t) => (t.type === 'ahorro' ? a + t.amount : a), 0);
  }

  byCat(period: Period): { id: string; name: string; total: number }[] {
    const r = this.range(period);
    const map = new Map<string, number>();
    this.inRange(r).forEach((t) => {
      if (t.type !== 'gasto' || !t.catId) return;
      map.set(t.catId, (map.get(t.catId) ?? 0) + t.amount);
    });
    return [...map.entries()]
      .map(([id, total]) => ({ id, name: this.cat(id).name, total }))
      .sort((a, b) => b.total - a.total);
  }

  cat(id: string): Category {
    return this.cats().concat(this.inCats()).find((c) => c.id === id) ?? { id, code: 'AHO', name: 'Ahorro' };
  }
  acct(id: string): Account {
    return this.accounts().find((a) => a.id === id) ?? { id, name: '—', balance: 0 };
  }
  goal(id: string): Goal {
    return this.goals().find((g) => g.id === id) ?? { id, kind: 'ahorro', name: '—', target: 0 };
  }

  nextCharge(sub: Subscription): Date {
    const t = FinanceStore.today();
    if (sub.cycle === 'Anual' && sub.month != null) {
      let d = new Date(t.getFullYear(), sub.month, sub.day);
      if (+d < +t) d = new Date(t.getFullYear() + 1, sub.month, sub.day);
      return d;
    }
    let d = new Date(t.getFullYear(), t.getMonth(), sub.day);
    if (+d < +t) d = new Date(t.getFullYear(), t.getMonth() + 1, sub.day);
    return d;
  }
  daysTo(d: Date): number {
    return Math.round((+d - +FinanceStore.today()) / 86400000);
  }
  upcomingSubs() {
    return this.subs()
      .map((sub) => {
        const date = this.nextCharge(sub);
        return { sub, date, days: this.daysTo(date) };
      })
      .sort((a, b) => a.days - b.days);
  }

  /* ── mutations ── */
  private async persistTx(t: Transaction, acctDelta: { id: string; delta: number } | null): Promise<void> {
    await db.tx.add(t);
    if (acctDelta) {
      const acct = await db.accounts.get(acctDelta.id);
      if (acct) await db.accounts.put({ ...acct, balance: acct.balance + acctDelta.delta });
    }
    await this.reloadAll();
  }

  async addExpense(input: { catId: string; amount: number; note: string; acctId: string }): Promise<void> {
    const hist = this.tx().filter((x) => x.type === 'gasto' && x.catId === input.catId);
    const avg = hist.length ? hist.reduce((a, x) => a + x.amount, 0) / hist.length : 0;

    const t: Transaction = {
      id: 'u' + Date.now(),
      type: 'gasto',
      catId: input.catId,
      amount: input.amount,
      ts: Date.now(),
      note: input.note.trim() || this.cat(input.catId).name,
      acctId: input.acctId,
    };
    await this.persistTx(t, { id: input.acctId, delta: -input.amount });

    if (this.prefs().alto && avg > 0 && input.amount > avg * 2.2) {
      const mult = Math.round((input.amount / avg) * 10) / 10;
      this.notif.notify('Gasto inusual en ' + this.cat(input.catId).name, fmt(input.amount) + ' es ' + mult + '× tu promedio de ' + fmt(avg) + '.');
    }
    const lim = this.goals().find((g) => g.kind === 'diario');
    if (this.prefs().diario && lim) {
      const dayTotal = this.spent(this.range('dia'));
      if (dayTotal > lim.target && dayTotal - input.amount <= lim.target) {
        this.notif.notify('Pasaste tu tope del día', 'Llevas ' + fmt(dayTotal) + ' de ' + fmt(lim.target) + '.');
      }
    }
  }

  async addIncome(input: { catId: string; amount: number; note: string; acctId: string }): Promise<void> {
    const t: Transaction = {
      id: 'u' + Date.now(),
      type: 'ingreso',
      catId: input.catId,
      amount: input.amount,
      ts: Date.now(),
      note: input.note.trim() || this.cat(input.catId).name,
      acctId: input.acctId,
    };
    await this.persistTx(t, { id: input.acctId, delta: input.amount });
  }

  async addSavingsContribution(input: { bucketId: string; amount: number; acctId: string }): Promise<void> {
    const g = this.goal(input.bucketId);
    const t: Transaction = {
      id: 'u' + Date.now(),
      type: 'ahorro',
      catId: null,
      bucketId: input.bucketId,
      amount: input.amount,
      ts: Date.now(),
      note: (g.kind === 'deuda' ? 'Pago · ' : 'Abono · ') + g.name,
      acctId: input.acctId,
    };
    const weekBefore = this.savedIn(this.range('semana'));
    await db.tx.add(t);
    const acct = await db.accounts.get(input.acctId);
    if (acct) await db.accounts.put({ ...acct, balance: acct.balance - input.amount });
    await db.goals.put({ ...g, saved: (g.saved ?? 0) + input.amount });
    await this.reloadAll();

    const weekAfter = weekBefore + input.amount;
    if (weekAfter >= this.weekGoal() && weekBefore < this.weekGoal()) {
      this.notif.notify('Meta semanal cumplida', 'Llevas ' + fmt(weekAfter) + ' ahorrados esta semana.');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const t = await db.tx.get(id);
    if (!t) return;
    await db.tx.delete(id);
    const acct = await db.accounts.get(t.acctId);
    if (acct) {
      // Reverse whatever balance effect this transaction had when it was created.
      const sign = t.type === 'gasto' ? 1 : t.type === 'ingreso' || t.type === 'ajuste' ? -1 : t.type === 'ahorro' ? 1 : 0;
      await db.accounts.put({ ...acct, balance: acct.balance + sign * t.amount });
    }
    if (t.type === 'ahorro' && t.bucketId) {
      const g = await db.goals.get(t.bucketId);
      if (g) await db.goals.put({ ...g, saved: (g.saved ?? 0) - t.amount });
    }
    await this.reloadAll();
  }

  async addCategory(name: string, kind: 'gasto' | 'ingreso' = 'gasto'): Promise<Category> {
    const id = 'c' + Date.now();
    const code = (name.replace(/[^a-záéíóúñ]/gi, '').slice(0, 3).toUpperCase() || 'NVA');
    const cat: Category = { id, code, name };
    await (kind === 'ingreso' ? db.inCats : db.cats).add(cat);
    await this.reloadAll();
    return cat;
  }

  async setAccountBalance(id: string, balance: number): Promise<void> {
    const acct = await db.accounts.get(id);
    if (!acct) return;
    const delta = balance - acct.balance;
    await db.accounts.put({ ...acct, balance });
    if (delta !== 0) {
      await db.tx.add({
        id: 'u' + Date.now(),
        type: 'ajuste',
        catId: null,
        amount: delta,
        ts: Date.now(),
        note: 'Ajuste de saldo · ' + acct.name,
        acctId: id,
      });
    }
    await this.reloadAll();
  }

  async addAccount(name: string, balance: number): Promise<void> {
    const id = 'a' + Date.now();
    await db.accounts.add({ id, name, balance });
    if (balance !== 0) {
      await db.tx.add({
        id: 'u' + Date.now(),
        type: 'ajuste',
        catId: null,
        amount: balance,
        ts: Date.now(),
        note: 'Saldo inicial · ' + name,
        acctId: id,
      });
    }
    await this.reloadAll();
  }

  async deleteAccount(id: string): Promise<void> {
    await db.accounts.delete(id);
    await this.reloadAll();
  }

  async addSubscription(input: { name: string; amount: number; date: Date; cycle: 'Mensual' | 'Anual'; remind: number }): Promise<Subscription> {
    const sub: Subscription = {
      id: 's' + Date.now(),
      name: input.name,
      amount: input.amount,
      day: input.date.getDate(),
      month: input.date.getMonth(),
      cycle: input.cycle,
      remind: input.remind,
    };
    await db.subs.add(sub);
    await this.reloadAll();
    return sub;
  }

  async addGoal(input: { kind: GoalKind; name: string; target: number; date?: string; catId?: string }): Promise<void> {
    const goal: Goal = {
      id: 'g' + Date.now(),
      kind: input.kind,
      name: input.name,
      target: input.target,
      saved: input.kind === 'ahorro' || input.kind === 'deuda' ? 0 : undefined,
      date: input.date,
      catId: input.catId,
    };
    await db.goals.add(goal);
    await this.reloadAll();
  }

  async deleteGoal(id: string): Promise<void> {
    await db.goals.delete(id);
    await this.reloadAll();
  }

  async deleteSubscription(id: string): Promise<void> {
    await db.subs.delete(id);
    await this.reloadAll();
  }

  async setSubRemind(id: string, remind: number): Promise<void> {
    const sub = await db.subs.get(id);
    if (!sub) return;
    await db.subs.put({ ...sub, remind });
    await this.reloadAll();
  }

  async setWeekGoal(amount: number): Promise<void> {
    if (!amount || amount <= 0) return;
    const next = { ...this.prefs(), weekGoal: Math.round(amount) };
    await db.prefs.put({ id: 'default', ...next });
    this.prefs.set(next);
  }

  async togglePref(key: 'subs' | 'alto' | 'diario'): Promise<void> {
    const next = { ...this.prefs(), [key]: !this.prefs()[key] };
    await db.prefs.put({ id: 'default', ...next });
    this.prefs.set(next);
  }

  /** Reminders for upcoming subscription charges, in the notice window set on each sub. */
  reminders(): { day: string; month: string; title: string; body: string }[] {
    if (!this.prefs().subs) return [];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return this.upcomingSubs()
      .filter((u) => u.sub.remind > 0)
      .map((u) => {
        const w = new Date(u.date);
        w.setDate(u.date.getDate() - u.sub.remind);
        return {
          day: String(w.getDate()),
          month: months[w.getMonth()],
          title: u.sub.name + ' · ' + fmt(u.sub.amount),
          body: 'Aviso ' + u.sub.remind + (u.sub.remind === 1 ? ' día antes' : ' días antes') + ' · cobro el ' + u.date.getDate() + ' ' + months[u.date.getMonth()],
        };
      });
  }

  /** Checks subscription notice windows against today and fires a real notification once per sub per day. */
  async checkReminders(): Promise<void> {
    if (!this.prefs().subs) return;
    const today = todayIso();
    const notified = { ...this.prefs().notified };
    let changed = false;
    for (const u of this.upcomingSubs()) {
      if (!u.sub.remind || u.days > u.sub.remind || u.days < 0) continue;
      if (notified[u.sub.id] === today) continue;
      this.notif.notify('Se acerca un cobro', u.sub.name + ' · ' + fmt(u.sub.amount) + ' el ' + u.date.getDate() + '/' + (u.date.getMonth() + 1) + '.');
      notified[u.sub.id] = today;
      changed = true;
    }
    if (changed) {
      const next = { ...this.prefs(), notified };
      await db.prefs.put({ id: 'default', ...next });
      this.prefs.set(next);
    }
  }

  /** Everything needed to fully restore this device's data elsewhere (or after it gets wiped). */
  async exportBackup(): Promise<Record<string, unknown>> {
    const [cats, inCats, accounts, tx, subs, goals, prefsRow] = await Promise.all([
      db.cats.toArray(),
      db.inCats.toArray(),
      db.accounts.toArray(),
      db.tx.toArray(),
      db.subs.toArray(),
      db.goals.toArray(),
      db.prefs.get('default'),
    ]);
    return { version: 1, exportedAt: new Date().toISOString(), cats, inCats, accounts, tx, subs, goals, prefs: prefsRow };
  }

  /** Replaces everything on this device with the contents of a backup produced by exportBackup(). */
  async importBackup(data: unknown): Promise<void> {
    const d = data as Record<string, unknown> | null;
    if (!d || !Array.isArray(d['cats']) || !Array.isArray(d['tx'])) {
      throw new Error('El archivo no tiene el formato de un respaldo de Finanzas.');
    }
    await db.transaction('rw', [db.cats, db.inCats, db.accounts, db.tx, db.subs, db.goals, db.prefs], async () => {
      await Promise.all([db.cats.clear(), db.inCats.clear(), db.accounts.clear(), db.tx.clear(), db.subs.clear(), db.goals.clear(), db.prefs.clear()]);
      await db.cats.bulkAdd((d['cats'] as Category[]) ?? []);
      await db.inCats.bulkAdd((d['inCats'] as Category[]) ?? []);
      await db.accounts.bulkAdd((d['accounts'] as Account[]) ?? []);
      await db.tx.bulkAdd((d['tx'] as Transaction[]) ?? []);
      await db.subs.bulkAdd((d['subs'] as Subscription[]) ?? []);
      await db.goals.bulkAdd((d['goals'] as Goal[]) ?? []);
      await db.prefs.put({ ...SEED_PREFS, ...((d['prefs'] as Partial<Prefs>) ?? {}), id: 'default' });
    });
    await this.reloadAll();
  }
}
