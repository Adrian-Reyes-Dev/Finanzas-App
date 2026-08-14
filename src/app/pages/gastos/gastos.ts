import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FinanceStore, Period } from '../../core/finance.store';
import { fmt } from '../../core/format';

const RAMP = ['#416180', '#597ea3', '#749dc4', '#94bce3', '#b5d9fd', '#2c455d', '#1d2d3d'];

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="seg">
        @for (p of periods; track p.id) {
          <button class="seg-opt" [class.selected]="store.period() === p.id" (click)="store.period.set(p.id)">{{ p.label }}</button>
        }
      </div>

      <div>
        <div class="sheet-kicker">{{ periodLabel() }}</div>
        <div style="display:flex;align-items:baseline;gap:10px">
          <div style="font-family:var(--font-heading);font-weight:600;font-size:38px;line-height:1.05;letter-spacing:-0.02em">{{ fmt(periodTotal()) }}</div>
        </div>
        <div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:2px">Ingresos del periodo {{ fmt(periodIncome()) }}</div>
      </div>

      @if (byCat().length) {
        <div style="display:flex;flex-direction:column;gap:11px">
          @for (c of byCat(); track c.id; let i = $index) {
            <div style="display:flex;align-items:center;gap:11px">
              <div style="width:10px;height:10px;flex:0 0 auto;background:{{ color(i) }}"></div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;gap:8px">
                  <div style="font-size:13px;font-weight:500">{{ c.name }}</div>
                  <div style="font-family:var(--font-heading);font-weight:600;font-size:14px">{{ fmt(c.total) }}</div>
                </div>
                <div style="height:4px;margin-top:4px;background:var(--color-neutral-200)">
                  <div style="height:100%;background:{{ color(i) }};width:{{ pct(c.total) }}%"></div>
                </div>
              </div>
              <div style="width:34px;text-align:right;font-size:11px;color:var(--color-neutral-600)">{{ pct(c.total) }}%</div>
            </div>
          }
        </div>
      }

      @if (limits().length) {
        <div>
          <h4 style="font-size:16px;margin-bottom:8px">Límites</h4>
          <div style="display:flex;flex-direction:column;gap:10px">
            @for (l of limits(); track l.id) {
              <div style="padding:10px 12px;border:1px solid {{ l.over ? 'var(--color-bad)' : 'var(--color-divider)' }}">
                <div style="display:flex;align-items:baseline;gap:8px">
                  <div style="flex:1;font-size:13px;font-weight:500">{{ l.name }}</div>
                  <div style="font-family:var(--font-heading);font-weight:600;font-size:15px">{{ fmt(l.spent) }}</div>
                  <div style="font-size:11.5px;color:var(--color-neutral-700)">/ {{ fmt(l.target) }}</div>
                </div>
                <div style="height:6px;margin-top:8px;background:var(--color-neutral-200);border:1px solid var(--color-divider)">
                  <div style="height:100%;background:{{ l.over ? 'var(--color-bad)' : 'var(--color-accent)' }};width:{{ l.barW }}%"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div>
        <h4 style="font-size:16px;margin-bottom:6px">Movimientos</h4>
        <div style="display:flex;flex-direction:column">
          @for (m of movements(); track m.id) {
            <div style="display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--color-divider)">
              <div style="width:34px;height:34px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-divider);font-family:var(--font-heading);font-weight:600;font-size:11px">{{ m.catId ? store.cat(m.catId).code : 'AHO' }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ m.note }}</div>
                <div style="font-size:11px;color:var(--color-neutral-600)">{{ m.ts | date: 'd MMM, HH:mm' }}</div>
              </div>
              <div style="font-family:var(--font-heading);font-weight:600;font-size:16px">{{ fmt(m.amount) }}</div>
              <button (click)="store.deleteTransaction(m.id)" style="width:30px;height:30px;flex:0 0 auto;border:1px solid var(--color-divider);background:transparent;cursor:pointer">×</button>
            </div>
          } @empty {
            <div style="padding:22px 0;text-align:center;font-size:13px;color:var(--color-neutral-600)">Sin movimientos en este periodo.</div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Gastos {
  fmt = fmt;
  readonly periods: { id: Period; label: string }[] = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'anio', label: 'Año' },
  ];

  readonly periodLabel = computed(() => this.periods.find((p) => p.id === this.store.period())?.label ?? '');
  readonly range = computed(() => this.store.range(this.store.period()));
  readonly periodTotal = computed(() => this.store.spent(this.range()));
  readonly periodIncome = computed(() => this.store.income(this.range()));
  readonly byCat = computed(() => this.store.byCat(this.store.period()));
  readonly movements = computed(() =>
    this.store
      .inRange(this.range())
      .filter((t) => t.type === 'gasto')
      .sort((a, b) => b.ts - a.ts),
  );

  readonly limits = computed(() => {
    const monthRange = this.store.range('mes');
    return this.store
      .goals()
      .filter((g) => g.kind === 'limite' || g.kind === 'diario')
      .map((g) => {
        const spent = g.kind === 'diario' ? this.store.spent(this.store.range('dia')) : this.store.inRange(monthRange).filter((t) => t.type === 'gasto' && t.catId === g.catId).reduce((a, t) => a + t.amount, 0);
        return { id: g.id, name: g.name, target: g.target, spent, barW: Math.min(100, Math.round((spent / g.target) * 100)), over: spent > g.target };
      });
  });

  constructor(public store: FinanceStore) {}

  color(i: number): string {
    return RAMP[i % RAMP.length];
  }
  pct(total: number): number {
    const sum = this.byCat().reduce((a, c) => a + c.total, 0) || 1;
    return Math.round((total / sum) * 100);
  }
}
