import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FinanceStore } from '../../core/finance.store';
import { fmt } from '../../core/format';
import { SheetService } from '../../shared/sheet.service';

@Component({
  selector: 'app-saldo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="blueprint" style="padding:14px">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <div class="sheet-kicker">Disponible ahora</div>
        <div style="font-family:var(--font-heading);font-weight:600;font-size:40px;line-height:1;letter-spacing:-0.02em">{{ fmt(store.available()) }}</div>
        <div style="display:flex;margin-top:14px;padding-top:12px;border-top:1px solid var(--color-divider)">
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Ingresos del mes</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:19px;color:var(--color-good)">{{ fmt(monthIncome()) }}</div>
          </div>
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Gastos del mes</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:19px">{{ fmt(monthSpent()) }}</div>
          </div>
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Balance</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:19px;color:{{ monthNet() >= 0 ? 'var(--color-good)' : 'var(--color-bad)' }}">{{ fmt(monthNet()) }}</div>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1px">
        @for (a of store.accounts(); track a.id) {
          <button (click)="sheetSvc.show({ kind: 'account', acctId: a.id })" style="display:block;width:100%;text-align:left;padding:12px;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);cursor:pointer">
            <div style="display:flex;align-items:baseline;gap:10px">
              <div style="flex:1;min-width:0">
                <div style="font-family:var(--font-heading);font-weight:600;font-size:18px;line-height:1.1">{{ a.name }}</div>
                <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-neutral-600)">{{ share(a) }}% del total · toca para actualizar</div>
              </div>
              <div style="font-family:var(--font-heading);font-weight:600;font-size:20px">{{ fmt(a.balance) }}</div>
            </div>
            <div style="height:5px;margin-top:9px;background:var(--color-neutral-200)">
              <div style="height:100%;background:var(--color-accent);width:{{ share(a) }}%"></div>
            </div>
          </button>
        }
      </div>

      <button class="btn btn-secondary btn-block blueprint" (click)="sheetSvc.show({ kind: 'account' })">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        Agregar app o efectivo
      </button>
    </div>
  `,
})
export class Saldo {
  fmt = fmt;
  readonly monthRange = computed(() => this.store.range('mes'));
  readonly monthIncome = computed(() => this.store.income(this.monthRange()));
  readonly monthSpent = computed(() => this.store.spent(this.monthRange()));
  readonly monthNet = computed(() => this.monthIncome() - this.monthSpent());

  constructor(
    public store: FinanceStore,
    public sheetSvc: SheetService,
  ) {}

  share(a: { balance: number }): number {
    const total = this.store.available() || 1;
    return Math.round((a.balance / total) * 100);
  }
}
