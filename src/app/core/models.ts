export type TxType = 'gasto' | 'ingreso' | 'ahorro';
export type GoalKind = 'ahorro' | 'deuda' | 'limite' | 'diario';

export interface Category {
  id: string;
  code: string;
  name: string;
  kind?: 'sub';
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: TxType;
  catId: string | null;
  bucketId?: string | null;
  amount: number;
  ts: number;
  note: string;
  acctId: string;
  sub?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  day: number;
  month?: number;
  cycle: 'Mensual' | 'Anual';
  remind: number;
}

export interface Goal {
  id: string;
  kind: GoalKind;
  name: string;
  target: number;
  saved?: number;
  date?: string;
  catId?: string;
}

export interface Prefs {
  subs: boolean;
  alto: boolean;
  diario: boolean;
  weekGoal: number;
  /** subId/'alto'/'diario' -> ISO date string of the last day a notification was already sent, so we don't repeat it. */
  notified: Record<string, string>;
}

export interface DateRange {
  start: number;
  end: number;
}
