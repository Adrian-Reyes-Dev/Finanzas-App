import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStore } from '../../core/finance.store';
import { SheetService } from '../sheet.service';

@Component({
  selector: 'app-sub-sheet',
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
              <div class="sheet-title">Suscripción</div>
            </div>
            <button class="sheet-close" (click)="sheet.close()">×</button>
          </div>
          <div class="sheet-body">
            <input class="input" type="text" placeholder="Nombre (ej. Netflix)" [ngModel]="name()" (ngModelChange)="name.set($event)" />
            <input class="input" type="number" inputmode="decimal" placeholder="Monto" [ngModel]="amount()" (ngModelChange)="amount.set($event)" />
            <div style="display:flex;gap:8px;align-items:center">
              <label style="flex:1;font-size:12px">Siguiente cobro</label>
              <input class="input" type="date" [ngModel]="date()" (ngModelChange)="date.set($event)" style="width:168px" />
            </div>
            <div class="seg">
              @for (c of cycles; track c) {
                <button class="seg-opt" [class.selected]="cycle() === c" (click)="cycle.set(c)">{{ c }}</button>
              }
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <span style="flex:1;font-size:12px">Recordarme</span>
              @for (d of remindOptions; track d) {
                <button class="seg-opt" style="flex:0 0 auto;min-width:52px" [class.selected]="remind() === d" (click)="remind.set(d)">{{ d }}d</button>
              }
            </div>
          </div>
          <div class="sheet-footer">
            <button class="btn btn-primary btn-block" [disabled]="!canSave()" (click)="save()">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SubSheet {
  readonly cycles: ('Mensual' | 'Anual')[] = ['Mensual', 'Anual'];
  readonly remindOptions = [1, 2, 3, 5, 7];

  readonly name = signal('');
  readonly amount = signal('');
  readonly date = signal('');
  readonly cycle = signal<'Mensual' | 'Anual'>('Mensual');
  readonly remind = signal(2);

  readonly open = computed(() => this.sheet.open()?.kind === 'sub');
  readonly canSave = computed(() => this.name().trim() && parseFloat(this.amount() || '0') > 0 && this.date());

  constructor(public sheet: SheetService, private store: FinanceStore) {
    effect(() => {
      if (this.open()) {
        this.name.set('');
        this.amount.set('');
        this.date.set('');
        this.cycle.set('Mensual');
        this.remind.set(2);
      }
    });
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const dt = new Date(this.date() + 'T07:00:00');
    const sub = await this.store.addSubscription({
      name: this.name().trim(),
      amount: parseFloat(this.amount()),
      date: dt,
      cycle: this.cycle(),
      remind: this.remind(),
    });
    this.sheet.say(sub.name + ' se cobra el ' + dt.getDate() + '/' + (dt.getMonth() + 1) + '.');
    this.sheet.close();
  }
}
