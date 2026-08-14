import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FinanceStore } from '../../core/finance.store';
import { fmt } from '../../core/format';
import { SheetService } from '../../shared/sheet.service';

@Component({
  selector: 'app-subs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="blueprint" style="padding:12px 14px">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <div class="sheet-kicker">Compromiso mensual</div>
        <div style="font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1">{{ fmt(total()) }}</div>
        <div style="font-size:12px;color:var(--color-neutral-700)">{{ store.subs().length }} suscripciones activas</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:1px">
        @for (s of upcoming(); track s.sub.id) {
          <div style="padding:12px;border:1px solid var(--color-divider);background:var(--color-surface)">
            <div style="display:flex;align-items:baseline;gap:10px">
              <div style="flex:1;min-width:0">
                <div style="font-family:var(--font-heading);font-weight:600;font-size:18px;line-height:1.1">{{ s.sub.name }}</div>
                <div style="font-size:11.5px;color:var(--color-neutral-700)">{{ s.sub.cycle }} · siguiente cobro {{ s.date.getDate() }}/{{ s.date.getMonth() + 1 }}</div>
              </div>
              <div style="text-align:right">
                <div style="font-family:var(--font-heading);font-weight:600;font-size:18px">{{ fmt(s.sub.amount) }}</div>
                <div style="font-size:11px;color:var(--color-accent-800)">{{ s.days === 0 ? 'hoy' : s.days + 'd' }}</div>
              </div>
              <button (click)="store.deleteSubscription(s.sub.id)" style="width:30px;height:30px;flex:0 0 auto;border:1px solid var(--color-divider);background:transparent;cursor:pointer">×</button>
            </div>
          </div>
        }
      </div>
      <button class="btn btn-primary btn-block blueprint" (click)="sheetSvc.show({ kind: 'sub' })">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        Agregar suscripción
      </button>
    </div>
  `,
})
export class Subs {
  fmt = fmt;
  readonly total = computed(() => this.store.subs().reduce((a, s) => a + s.amount, 0));
  readonly upcoming = computed(() => this.store.upcomingSubs());

  constructor(
    public store: FinanceStore,
    public sheetSvc: SheetService,
  ) {}
}
