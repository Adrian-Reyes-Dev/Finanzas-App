import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStore } from '../../core/finance.store';
import { GoalKind } from '../../core/models';
import { SheetService } from '../sheet.service';

@Component({
  selector: 'app-goal-sheet',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="sheet-backdrop" (click)="sheet.close()">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="sheet-header">
            <div style="flex:1">
              <div class="sheet-kicker">Nueva</div>
              <div class="sheet-title">Meta</div>
            </div>
            <button class="sheet-close" (click)="sheet.close()">×</button>
          </div>
          <div class="sheet-body">
            <div class="tile-grid-2">
              @for (k of kinds; track k.id) {
                <button class="tile" [class.selected]="kind() === k.id" (click)="kind.set(k.id)">
                  <span class="tile-code" style="font-size:13px">{{ k.label }}</span>
                </button>
              }
            </div>
            <div style="font-size:11.5px;line-height:1.45;color:var(--color-neutral-700)">{{ hint() }}</div>
            <input class="input" type="text" [placeholder]="namePh()" [ngModel]="name()" (ngModelChange)="name.set($event)" />
            <input class="input" type="number" inputmode="decimal" [placeholder]="targetPh()" [ngModel]="target()" (ngModelChange)="target.set($event)" />
            @if (kind() === 'ahorro') {
              <div style="display:flex;gap:8px;align-items:center">
                <label style="flex:1;font-size:12px">Fecha límite (opcional)</label>
                <input class="input" type="date" [ngModel]="date()" (ngModelChange)="date.set($event)" style="width:168px" />
              </div>
            }
            @if (kind() === 'limite') {
              <div>
                <div class="sheet-kicker" style="color:var(--color-neutral-600);margin-bottom:7px">Categoría a limitar</div>
                <div class="tile-grid">
                  @for (c of store.cats(); track c.id) {
                    <button class="tile" [class.selected]="catId() === c.id" (click)="catId.set(c.id)">
                      <span class="tile-code">{{ c.code }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
          <div class="sheet-footer">
            <button class="btn btn-primary btn-block" [disabled]="!canSave()" (click)="save()">Guardar meta</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GoalSheet {
  readonly kinds: { id: GoalKind; label: string }[] = [
    { id: 'ahorro', label: 'Ahorro' },
    { id: 'deuda', label: 'Deuda' },
    { id: 'limite', label: 'Límite' },
    { id: 'diario', label: 'Tope diario' },
  ];

  readonly kind = signal<GoalKind>('ahorro');
  readonly name = signal('');
  readonly target = signal('');
  readonly date = signal('');
  readonly catId = signal<string | null>(null);

  readonly open = computed(() => this.sheet.open()?.kind === 'goal');

  readonly hint = computed(() => {
    switch (this.kind()) {
      case 'ahorro':
        return 'Una meta de ahorro que llenas con abonos manuales.';
      case 'deuda':
        return 'Una deuda que vas pagando — el progreso muestra lo pagado.';
      case 'limite':
        return 'Un tope mensual para una categoría de gasto.';
      default:
        return 'Un tope de gasto para cada día.';
    }
  });
  readonly namePh = computed(() => (this.kind() === 'limite' || this.kind() === 'diario' ? 'Nombre del límite' : 'Nombre de la meta'));
  readonly targetPh = computed(() => (this.kind() === 'deuda' ? 'Monto total de la deuda' : this.kind() === 'diario' ? 'Tope por día' : 'Monto objetivo'));

  readonly canSave = computed(() => {
    const t = parseFloat(this.target() || '0');
    if (!t) return false;
    if (this.kind() === 'diario') return true;
    if (this.kind() === 'limite') return this.name().trim().length > 0 && !!this.catId();
    return this.name().trim().length > 0;
  });

  constructor(public sheet: SheetService, public store: FinanceStore) {
    effect(() => {
      if (this.open()) {
        this.kind.set('ahorro');
        this.name.set('');
        this.target.set('');
        this.date.set('');
        this.catId.set(store.cats()[0]?.id ?? null);
      }
    });
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const name = this.kind() === 'diario' ? 'Tope del día' : this.name().trim();
    await this.store.addGoal({
      kind: this.kind(),
      name,
      target: parseFloat(this.target()),
      date: this.date() || undefined,
      catId: this.kind() === 'limite' ? (this.catId() ?? undefined) : undefined,
    });
    this.sheet.say('«' + name + '» creada.');
    this.sheet.close();
  }
}
