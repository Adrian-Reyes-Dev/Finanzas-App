import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStore } from '../../core/finance.store';
import { SheetService } from '../sheet.service';

@Component({
  selector: 'app-add-tx-sheet',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state(); as s) {
      <div class="sheet-backdrop" (click)="sheet.close()">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="sheet-header">
            <div style="flex:1">
              <div class="sheet-kicker">{{ kicker() }}</div>
              <div class="sheet-title">{{ title() }}</div>
            </div>
            <button class="sheet-close" (click)="sheet.close()">×</button>
          </div>

          <div class="sheet-body">
            <div class="blueprint" style="padding:11px 14px;display:flex;align-items:baseline;gap:8px">
              <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
              <div style="font-family:var(--font-heading);font-weight:600;font-size:22px;color:var(--color-accent-700)">$</div>
              <input
                class="input"
                style="border:0;background:transparent;font-family:var(--font-heading);font-weight:600;font-size:38px;padding:0;flex:1"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                [ngModel]="amount()"
                (ngModelChange)="amount.set($event)"
                autofocus
              />
            </div>

            @if (s.mode === 'abono') {
              <div>
                <div class="sheet-kicker" style="color:var(--color-neutral-600);margin-bottom:7px">A qué meta</div>
                <div class="tile-grid-2">
                  @for (b of buckets(); track b.id) {
                    <button class="tile" style="align-items:flex-start;text-align:left" [class.selected]="bucketId() === b.id" (click)="bucketId.set(b.id)">
                      <span class="tile-code" style="font-size:13px">{{ b.name }}</span>
                      <span class="tile-name" style="text-align:left">{{ b.kind === 'deuda' ? 'deuda' : 'ahorro' }}</span>
                    </button>
                  }
                </div>
              </div>
            } @else {
              <div>
                <div class="sheet-kicker" style="color:var(--color-neutral-600);margin-bottom:7px">Categoría</div>
                <div class="tile-grid">
                  @for (c of categories(); track c.id) {
                    <button class="tile" [class.selected]="catId() === c.id" (click)="catId.set(c.id)">
                      <span class="tile-code">{{ c.code }}</span>
                      <span class="tile-name">{{ c.name }}</span>
                    </button>
                  }
                </div>
              </div>
              <input class="input" type="text" placeholder="Nota (opcional)" [ngModel]="note()" (ngModelChange)="note.set($event)" />
            }

            <div>
              <div class="sheet-kicker" style="color:var(--color-neutral-600);margin-bottom:7px">Cuenta</div>
              <div class="tile-grid-2">
                @for (a of store.accounts(); track a.id) {
                  <button class="tile" style="flex-direction:row;justify-content:space-between;align-items:baseline" [class.selected]="acctId() === a.id" (click)="acctId.set(a.id)">
                    <span style="font-size:12.5px;font-weight:500">{{ a.name }}</span>
                    <span style="font-family:var(--font-heading);font-weight:600;font-size:12px;opacity:.75">{{ fmt(a.balance) }}</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="sheet-footer">
            <button class="btn btn-primary btn-block blueprint" [disabled]="!canSave()" (click)="save()">
              <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AddTxSheet {
  readonly amount = signal('');
  readonly catId = signal<string | null>(null);
  readonly bucketId = signal<string | null>(null);
  readonly acctId = signal<string | null>(null);
  readonly note = signal('');

  readonly state = computed(() => {
    const s = this.sheet.open();
    return s && s.kind === 'tx' ? s : null;
  });

  readonly categories = computed(() => (this.state()?.mode === 'ingreso' ? this.store.inCats() : this.store.cats().filter((c) => c.kind !== 'sub')));
  readonly buckets = computed(() => this.store.goals().filter((g) => g.kind === 'ahorro' || g.kind === 'deuda'));

  readonly kicker = computed(() => {
    const m = this.state()?.mode;
    return m === 'ingreso' ? 'Nuevo' : m === 'abono' ? 'Nuevo' : 'Nuevo';
  });
  readonly title = computed(() => {
    const m = this.state()?.mode;
    return m === 'ingreso' ? 'Ingreso' : m === 'abono' ? 'Abono' : 'Gasto';
  });

  readonly canSave = computed(() => {
    const amt = parseFloat(this.amount() || '0');
    if (!amt || !this.acctId()) return false;
    const m = this.state()?.mode;
    if (m === 'abono') return !!this.bucketId();
    return !!this.catId();
  });

  constructor(
    public sheet: SheetService,
    public store: FinanceStore,
  ) {
    effect(() => {
      const s = this.sheet.open();
      if (s && s.kind === 'tx') {
        this.amount.set('');
        this.catId.set(null);
        this.note.set('');
        this.acctId.set(this.store.accounts()[0]?.id ?? null);
        this.bucketId.set(s.bucketId ?? null);
      }
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  }

  async save(): Promise<void> {
    const s = this.state();
    if (!s || !this.canSave()) return;
    const amount = parseFloat(this.amount());
    const acctId = this.acctId()!;
    if (s.mode === 'gasto') {
      await this.store.addExpense({ catId: this.catId()!, amount, note: this.note(), acctId });
      this.sheet.say('Registrado: ' + this.fmt(amount) + ' en ' + this.store.cat(this.catId()!).name + '.');
    } else if (s.mode === 'ingreso') {
      await this.store.addIncome({ catId: this.catId()!, amount, note: this.note(), acctId });
      this.sheet.say('Ingreso de ' + this.fmt(amount) + ' registrado.');
    } else {
      await this.store.addSavingsContribution({ bucketId: this.bucketId()!, amount, acctId });
      this.sheet.say('Abono de ' + this.fmt(amount) + ' registrado.');
    }
    this.sheet.close();
  }
}
