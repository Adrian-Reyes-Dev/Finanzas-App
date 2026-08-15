import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceStore } from '../../core/finance.store';
import { SheetService } from '../sheet.service';

@Component({
  selector: 'app-account-sheet',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state(); as s) {
      <div class="sheet-backdrop" (click)="sheet.close()">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="sheet-header">
            <div style="flex:1">
              <div class="sheet-kicker">{{ s.acctId ? 'Actualizar' : 'Nueva' }}</div>
              <div class="sheet-title">{{ s.acctId ? store.acct(s.acctId).name : 'Cuenta' }}</div>
            </div>
            <button class="sheet-close" (click)="sheet.close()">×</button>
          </div>
          <div class="sheet-body">
            @if (!s.acctId) {
              <input class="input" type="text" placeholder="Nombre de la app (ej. Nu, Mercado Pago, efectivo)" [ngModel]="name()" (ngModelChange)="name.set($event)" />
            }
            <input class="input" type="number" inputmode="decimal" placeholder="Saldo" [ngModel]="balance()" (ngModelChange)="balance.set($event)" />
            @if (s.acctId) {
              <button class="btn btn-secondary btn-block" style="color:var(--color-bad);border-color:var(--color-bad)" (click)="remove(s.acctId)">Eliminar cuenta</button>
            }
          </div>
          <div class="sheet-footer">
            <button class="btn btn-primary btn-block" [disabled]="!canSave()" (click)="save(s.acctId)">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AccountSheet {
  readonly name = signal('');
  readonly balance = signal('');

  readonly state = computed(() => {
    const s = this.sheet.open();
    return s && s.kind === 'account' ? s : null;
  });
  readonly canSave = computed(() => this.balance() !== '' && (this.state()?.acctId || this.name().trim()));

  constructor(
    public sheet: SheetService,
    public store: FinanceStore,
  ) {
    effect(() => {
      const s = this.sheet.open();
      if (s && s.kind === 'account') {
        this.name.set('');
        this.balance.set(s.acctId ? String(this.store.acct(s.acctId).balance) : '');
      }
    });
  }

  async save(acctId?: string): Promise<void> {
    const balance = parseFloat(this.balance() || '0');
    if (acctId) {
      await this.store.setAccountBalance(acctId, balance);
      this.sheet.say('Saldo de ' + this.store.acct(acctId).name + ' actualizado.');
    } else {
      const name = this.name().trim();
      if (!name) return;
      await this.store.addAccount(name, balance);
      this.sheet.say(name + ' agregada.');
    }
    this.sheet.close();
  }

  async remove(acctId: string): Promise<void> {
    const name = this.store.acct(acctId).name;
    if (!confirm('¿Eliminar «' + name + '»? El historial de movimientos que ya se registró con esta cuenta se conserva.')) return;
    await this.store.deleteAccount(acctId);
    this.sheet.say(name + ' eliminada.');
    this.sheet.close();
  }
}
