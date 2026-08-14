import Dexie, { Table } from 'dexie';
import { Account, Category, Goal, Prefs, Subscription, Transaction } from './models';

export class FinanzasDb extends Dexie {
  cats!: Table<Category, string>;
  inCats!: Table<Category, string>;
  accounts!: Table<Account, string>;
  tx!: Table<Transaction, string>;
  subs!: Table<Subscription, string>;
  goals!: Table<Goal, string>;
  prefs!: Table<Prefs & { id: string }, string>;

  constructor() {
    super('finanzas-app');
    this.version(1).stores({
      cats: 'id',
      inCats: 'id',
      accounts: 'id',
      tx: 'id, ts, type, catId, bucketId',
      subs: 'id, day',
      goals: 'id, kind',
      prefs: 'id',
    });
  }
}

export const db = new FinanzasDb();
