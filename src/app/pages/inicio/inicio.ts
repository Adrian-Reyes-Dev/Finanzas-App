import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FinanceStore } from '../../core/finance.store';
import { SheetService } from '../../shared/sheet.service';
import { fmt, fmtShort } from '../../core/format';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="blueprint" style="padding:14px 14px 16px">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <div class="sheet-kicker">Gastado hoy</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:1px">
          <div style="font-family:var(--font-heading);font-weight:600;font-size:44px;line-height:1;letter-spacing:-0.02em">{{ fmt(todayTotal()) }}</div>
          @if (dayLimit(); as l) {
            <div style="font-size:12px;color:var(--color-neutral-700)">de {{ fmt(l) }} al día</div>
          }
        </div>
        @if (dayLimit(); as l) {
          <div style="height:8px;margin-top:12px;background:var(--color-neutral-200);border:1px solid var(--color-divider)">
            <div style="height:100%;background:{{ todayTotal() > l ? 'var(--color-bad)' : 'var(--color-accent)' }};width:{{ dayBarW() }}"></div>
          </div>
        }
        <div style="display:flex;margin-top:14px;border-top:1px solid var(--color-divider);padding-top:12px">
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Disponible</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:17px">{{ fmt(store.available()) }}</div>
          </div>
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Ahorrado</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:17px;color:var(--color-accent-800)">{{ fmt(store.savedAll()) }}</div>
          </div>
          <div style="flex:1">
            <div class="sheet-kicker" style="color:var(--color-neutral-600)">Mes</div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:17px">{{ fmt(monthTotal()) }}</div>
          </div>
        </div>
      </div>

      <div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:9px">
          <h4 style="font-size:16px">Últimos 7 días</h4>
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:78px;padding:0 2px;border-bottom:1px solid var(--color-divider)">
          @for (d of week7(); track d.label) {
            <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;height:100%">
              <div style="font-size:9.5px;color:var(--color-neutral-600)">{{ fmtShort(d.amount) }}</div>
              <div style="width:100%;background:var(--color-accent);height:{{ d.h }}%"></div>
            </div>
          }
        </div>
        <div style="display:flex;gap:6px;padding:5px 2px 0">
          @for (d of week7(); track d.label) {
            <div style="flex:1;text-align:center;font-family:var(--font-heading);font-weight:600;font-size:10.5px;color:var(--color-neutral-600)">{{ d.label }}</div>
          }
        </div>
      </div>

      @if (upcoming().length) {
        <div>
          <h4 style="font-size:16px;margin-bottom:8px">Próximos cobros</h4>
          <div style="display:flex;flex-direction:column;gap:1px">
            @for (s of upcoming(); track s.sub.id) {
              <div style="display:flex;align-items:center;gap:12px;padding:11px 12px;border:1px solid var(--color-divider);background:var(--color-surface)">
                <div style="width:38px;height:38px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-accent-400);font-family:var(--font-heading);font-weight:600;font-size:13px;color:var(--color-accent-800);background:var(--color-accent-100)">{{ s.days }}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-family:var(--font-heading);font-weight:600;font-size:16px">{{ s.sub.name }}</div>
                  <div style="font-size:11.5px;color:var(--color-neutral-700)">{{ s.sub.cycle }}</div>
                </div>
                <div style="font-family:var(--font-heading);font-weight:600;font-size:17px">{{ fmt(s.sub.amount) }}</div>
              </div>
            }
          </div>
        </div>
      }

      @if (weekGoal(); as g) {
        <div>
          <h4 style="font-size:16px;margin-bottom:8px">Ahorro de la semana</h4>
          <div class="blueprint" style="padding:12px 14px">
            <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
            <div style="display:flex;align-items:baseline;gap:8px">
              <div style="font-family:var(--font-heading);font-weight:600;font-size:26px">{{ fmt(weekSaved()) }}</div>
              <div style="font-size:12px;color:var(--color-neutral-700)">de {{ fmt(g) }} esta semana</div>
            </div>
            <div style="height:7px;margin-top:10px;background:var(--color-neutral-200);border:1px solid var(--color-divider)">
              <div style="height:100%;background:var(--color-accent);width:{{ weekSavedPct() }}%"></div>
            </div>
          </div>
        </div>
      }

      <div>
        <h4 style="font-size:16px;margin-bottom:6px">Últimos movimientos</h4>
        <div style="display:flex;flex-direction:column">
          @for (m of recent(); track m.id) {
            <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--color-divider)">
              <div style="width:34px;height:34px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-divider);font-family:var(--font-heading);font-weight:600;font-size:11px">{{ codeFor(m) }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ m.note }}</div>
                <div style="font-size:11px;color:var(--color-neutral-600)">{{ m.ts | date: 'd MMM, HH:mm' }}</div>
              </div>
              <div style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:{{ colorFor(m) }}">{{ signFor(m) }}{{ fmt(m.amount) }}</div>
            </div>
          } @empty {
            <div style="padding:18px 0;text-align:center;font-size:13px;color:var(--color-neutral-600)">Sin movimientos todavía.</div>
          }
        </div>
      </div>
    </div>

    <button
      class="blueprint"
      style="position:fixed;right:16px;bottom:calc(78px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;height:52px;padding:0 16px;background:var(--color-accent);color:var(--color-bg);border:1px solid var(--color-accent-700);font-family:var(--font-heading);font-weight:600;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;box-shadow:var(--shadow-md);cursor:pointer;z-index:5"
      (click)="sheetSvc.show({ kind: 'tx', mode: 'gasto' })"
    >
      <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
      <span style="font-size:20px;line-height:1;margin-top:-2px">+</span>
      Registrar
    </button>
  `,
})
export class Inicio {
  fmt = fmt;
  fmtShort = fmtShort;

  readonly todayTotal = computed(() => this.store.spent(this.store.range('dia')));
  readonly monthTotal = computed(() => this.store.spent(this.store.range('mes')));
  readonly dayLimit = computed(() => this.store.goals().find((g) => g.kind === 'diario')?.target ?? null);
  readonly dayBarW = computed(() => {
    const l = this.dayLimit();
    if (!l) return 0;
    return Math.min(100, Math.round((this.todayTotal() / l) * 100));
  });

  readonly week7 = computed(() => {
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const today = FinanceStore.today();
    const out: { label: string; amount: number; h: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const amount = this.store.spent({ start: +d, end: +next });
      out.push({ label: days[d.getDay() === 0 ? 6 : d.getDay() - 1], amount, h: 0 });
    }
    const max = Math.max(1, ...out.map((d) => d.amount));
    out.forEach((d) => (d.h = Math.max(4, Math.round((d.amount / max) * 100))));
    return out;
  });

  readonly upcoming = computed(() => this.store.upcomingSubs().filter((s) => s.days <= 7).slice(0, 2));
  readonly weekGoal = computed(() => this.store.weekGoal());
  readonly weekSaved = computed(() => this.store.savedIn(this.store.range('semana')));
  readonly weekSavedPct = computed(() => Math.min(100, Math.round((this.weekSaved() / this.weekGoal()) * 100)));
  readonly recent = computed(() => this.store.tx().slice(0, 5));

  constructor(
    public store: FinanceStore,
    public sheetSvc: SheetService,
  ) {}

  codeFor(m: { type: string; catId: string | null; bucketId?: string | null }): string {
    if (m.type === 'ahorro') return 'AHO';
    return m.catId ? this.store.cat(m.catId).code : 'AHO';
  }
  colorFor(m: { type: string }): string {
    return m.type === 'ingreso' ? 'var(--color-good)' : m.type === 'ahorro' ? 'var(--color-accent-800)' : 'var(--color-text)';
  }
  signFor(m: { type: string }): string {
    return m.type === 'ingreso' ? '+' : m.type === 'gasto' ? '-' : '';
  }
}
