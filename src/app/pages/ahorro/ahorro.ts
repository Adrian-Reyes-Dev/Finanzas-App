import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStore } from '../../core/finance.store';
import { fmt } from '../../core/format';
import { SheetService } from '../../shared/sheet.service';

@Component({
  selector: 'app-ahorro',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="blueprint" style="padding:14px">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <div class="sheet-kicker">Ahorrado en total</div>
        <div style="font-family:var(--font-heading);font-weight:600;font-size:38px;line-height:1;letter-spacing:-0.02em">{{ fmt(store.savedAll()) }}</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--color-divider)">
          <div style="flex:1;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-600)">Meta semanal</div>
          <div style="font-family:var(--font-heading);font-weight:600;font-size:17px">{{ fmt(weekSaved()) }}</div>
          <div style="font-size:12px;color:var(--color-neutral-700)">/ {{ fmt(store.weekGoal()) }}</div>
        </div>
        <div style="height:7px;margin-top:9px;background:var(--color-neutral-200);border:1px solid var(--color-divider)">
          <div style="height:100%;background:var(--color-accent);width:{{ weekSavedPct() }}%"></div>
        </div>
        <div style="margin-top:12px">
          <div style="font-size:11.5px;color:var(--color-neutral-700);margin-bottom:6px">Meta semanal personalizada</div>
          <div style="display:flex;gap:6px">
            <input
              class="input"
              type="number"
              inputmode="decimal"
              min="1"
              placeholder="Monto por semana"
              [ngModel]="weekGoalInput()"
              (ngModelChange)="weekGoalInput.set($event)"
              style="flex:1;min-height:40px"
            />
            <button class="btn btn-primary" style="min-height:40px" [disabled]="!canSaveWeekGoal()" (click)="saveWeekGoal()">Guardar</button>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        @for (b of buckets(); track b.id) {
          <div class="blueprint" style="padding:13px 14px 14px">
            <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
              <div class="sheet-kicker">{{ b.kind === 'deuda' ? 'Deuda' : 'Ahorro' }}</div>
            </div>
            <div style="font-family:var(--font-heading);font-weight:600;font-size:20px;line-height:1.1;margin-top:2px">{{ b.name }}</div>
            <div style="display:flex;align-items:baseline;gap:6px;margin-top:5px">
              <div style="font-family:var(--font-heading);font-weight:600;font-size:24px">{{ fmt(b.saved ?? 0) }}</div>
              <div style="font-size:12px;color:var(--color-neutral-700)">/ {{ fmt(b.target) }}</div>
              <div style="margin-left:auto;font-size:12px;color:var(--color-accent-800)">{{ pct(b) }}%</div>
            </div>
            <div style="height:8px;margin-top:9px;background:var(--color-neutral-200);border:1px solid var(--color-divider)">
              <div style="height:100%;background:var(--color-accent);width:{{ pct(b) }}%"></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:11px">
              <button class="btn btn-primary" style="flex:1" (click)="sheetSvc.show({ kind: 'tx', mode: 'abono', bucketId: b.id })">{{ b.kind === 'deuda' ? 'Pagar' : 'Abonar' }}</button>
              <button (click)="store.deleteGoal(b.id)" style="width:42px;border:1px solid var(--color-divider);background:transparent;cursor:pointer">×</button>
            </div>
          </div>
        } @empty {
          <div style="padding:18px 0;text-align:center;font-size:13px;color:var(--color-neutral-600)">Aún no tienes metas de ahorro.</div>
        }
      </div>

      <button class="btn btn-secondary btn-block blueprint" (click)="sheetSvc.show({ kind: 'goal' })">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        Nueva meta de ahorro
      </button>
    </div>
  `,
})
export class Ahorro {
  fmt = fmt;
  readonly weekGoalInput = signal('');

  readonly buckets = computed(() => this.store.goals().filter((g) => g.kind === 'ahorro' || g.kind === 'deuda'));
  readonly weekSaved = computed(() => this.store.savedIn(this.store.range('semana')));
  readonly weekSavedPct = computed(() => Math.min(100, Math.round((this.weekSaved() / this.store.weekGoal()) * 100)));
  readonly canSaveWeekGoal = computed(() => parseFloat(this.weekGoalInput() || '0') > 0);

  constructor(
    public store: FinanceStore,
    public sheetSvc: SheetService,
  ) {
    this.weekGoalInput.set(String(this.store.weekGoal()));
  }

  pct(b: { target: number; saved?: number }): number {
    return Math.min(100, Math.round(((b.saved ?? 0) / b.target) * 100));
  }

  async saveWeekGoal(): Promise<void> {
    const amount = parseFloat(this.weekGoalInput());
    if (!amount || amount <= 0) return;
    await this.store.setWeekGoal(amount);
    this.sheetSvc.say('Meta semanal ajustada a ' + this.fmt(amount) + '.');
  }
}
