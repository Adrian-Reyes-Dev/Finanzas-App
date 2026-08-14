import { Injectable, signal } from '@angular/core';

export type SheetState =
  | { kind: 'tx'; mode: 'gasto' | 'ingreso' | 'abono'; bucketId?: string }
  | { kind: 'account'; acctId?: string }
  | { kind: 'sub' }
  | { kind: 'goal' }
  | null;

@Injectable({ providedIn: 'root' })
export class SheetService {
  readonly open = signal<SheetState>(null);
  readonly toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  show(state: SheetState): void {
    this.open.set(state);
  }
  close(): void {
    this.open.set(null);
  }
  say(text: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(text);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2600);
  }
}
