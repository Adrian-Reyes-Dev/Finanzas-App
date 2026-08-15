import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FinanceStore } from '../../core/finance.store';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-avisos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;flex-direction:column;gap:18px">
      @if (notif.permission() !== 'granted') {
        <div class="blueprint" style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
          <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
          <div style="font-size:13px;line-height:1.4">
            @if (notif.permission() === 'unsupported') {
              Este navegador no soporta notificaciones del sistema — de todos modos verás avisos dentro de la app.
            } @else {
              Activa las notificaciones para recibir avisos aunque no tengas la app abierta.
            }
          </div>
          @if (notif.permission() === 'default') {
            <button class="btn btn-primary" (click)="notif.requestPermission()">Activar notificaciones</button>
          }
        </div>
      }

      <div>
        <h4 style="font-size:16px;margin-bottom:8px">Programados</h4>
        <div style="display:flex;flex-direction:column;gap:1px">
          @for (r of reminders(); track r.title) {
            <div style="display:flex;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--color-divider);background:var(--color-surface)">
              <div style="width:44px;flex:0 0 auto;text-align:center;border-right:1px solid var(--color-divider);padding-right:8px">
                <div style="font-family:var(--font-heading);font-weight:600;font-size:17px;line-height:1">{{ r.day }}</div>
                <div style="font-size:9.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-600)">{{ r.month }}</div>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:500">{{ r.title }}</div>
                <div style="font-size:11.5px;color:var(--color-neutral-700)">{{ r.body }}</div>
              </div>
            </div>
          } @empty {
            <div style="padding:18px 0;font-size:13px;color:var(--color-neutral-600)">No hay avisos programados.</div>
          }
        </div>
      </div>

      <div>
        <h4 style="font-size:16px;margin-bottom:8px">Aviso por suscripción</h4>
        <div style="display:flex;flex-direction:column;gap:1px">
          @for (s of store.subs(); track s.id) {
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--color-divider);background:var(--color-surface)">
              <span style="flex:1;font-size:13.5px;font-weight:500">{{ s.name }}</span>
              @for (d of remindOptions; track d) {
                <button (click)="store.setSubRemind(s.id, d)" style="min-width:38px;min-height:32px;padding:0 6px;border:1px solid {{ s.remind === d ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ s.remind === d ? 'var(--color-accent)' : 'transparent' }};color:{{ s.remind === d ? 'var(--color-bg)' : 'var(--color-text)' }};font-family:var(--font-heading);font-weight:600;font-size:11.5px;cursor:pointer">{{ d }}d</button>
              }
              <button (click)="store.setSubRemind(s.id, 0)" style="min-width:38px;min-height:32px;padding:0 6px;border:1px solid {{ s.remind === 0 ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ s.remind === 0 ? 'var(--color-accent)' : 'transparent' }};color:{{ s.remind === 0 ? 'var(--color-bg)' : 'var(--color-text)' }};font-family:var(--font-heading);font-weight:600;font-size:11.5px;cursor:pointer">No</button>
            </div>
          }
        </div>
      </div>

      <div>
        <h4 style="font-size:16px;margin-bottom:8px">Qué me avisa</h4>
        <div style="display:flex;flex-direction:column;gap:1px">
          @for (p of prefOptions; track p.key) {
            <button (click)="store.togglePref(p.key)" style="display:flex;align-items:center;gap:12px;text-align:left;width:100%;min-height:56px;padding:10px 12px;border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);cursor:pointer">
              <div style="flex:1;min-width:0">
                <div style="font-size:13.5px;font-weight:500">{{ p.label }}</div>
                <div style="font-size:11.5px;color:var(--color-neutral-700)">{{ p.desc }}</div>
              </div>
              <div style="width:46px;height:26px;flex:0 0 auto;position:relative;border:1px solid {{ store.prefs()[p.key] ? 'var(--color-accent)' : 'var(--color-divider)' }};background:{{ store.prefs()[p.key] ? 'var(--color-accent)' : 'transparent' }}">
                <div style="position:absolute;top:2px;left:{{ store.prefs()[p.key] ? '24px' : '2px' }};width:18px;height:20px;background:{{ store.prefs()[p.key] ? 'var(--color-bg)' : 'var(--color-neutral-500)' }};transition:left .16s ease"></div>
              </div>
            </button>
          }
        </div>
      </div>

      <button class="btn btn-secondary btn-block" (click)="notif.notify('Aviso de prueba', 'Así se ven tus notificaciones.')">Probar notificación</button>

      <div>
        <h4 style="font-size:16px;margin-bottom:8px">Respaldo</h4>
        <div style="font-size:11.5px;line-height:1.5;color:var(--color-neutral-700);margin-bottom:8px">Todo vive solo en este dispositivo — no hay servidor. Guarda un respaldo de vez en cuando (a Drive, Files, donde quieras) para no depender de que el navegador nunca borre nada.</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" style="flex:1" (click)="exportBackup()">Exportar respaldo</button>
          <button class="btn btn-secondary" style="flex:1" (click)="fileInput.click()">Importar respaldo</button>
        </div>
        <input #fileInput type="file" accept="application/json" style="display:none" (change)="onImportFile($event)" />
      </div>

      <div>
        <h4 style="font-size:16px;margin-bottom:8px">Datos locales</h4>
        <div style="font-size:11.5px;line-height:1.5;color:var(--color-neutral-700);margin-bottom:8px">Borrar los datos elimina cuentas, movimientos, metas y suscripciones de este dispositivo — no se puede deshacer.</div>
        <button class="btn btn-block" style="color:var(--color-bad);border-color:var(--color-bad)" (click)="wipe()">Borrar todos los datos</button>
      </div>
    </div>
  `,
})
export class Avisos {
  readonly remindOptions = [1, 2, 3, 7];
  readonly prefOptions: { key: 'subs' | 'alto' | 'diario'; label: string; desc: string }[] = [
    { key: 'subs', label: 'Antes de un cobro', desc: 'Suscripciones, con los días que elijas en cada una' },
    { key: 'alto', label: 'Gasto inusualmente alto', desc: 'Cuando un gasto pasa 2× tu promedio de esa categoría' },
    { key: 'diario', label: 'Tope del día', desc: 'Cuando pasas tu límite diario' },
  ];

  readonly reminders = computed(() => this.store.reminders());

  constructor(
    public store: FinanceStore,
    public notif: NotificationService,
  ) {}

  async wipe(): Promise<void> {
    if (!confirm('¿Borrar todos los datos? Esto elimina cuentas, movimientos, metas y suscripciones de este dispositivo y no se puede deshacer.')) return;
    await this.store.wipeAll();
  }

  async exportBackup(): Promise<void> {
    const data = await this.store.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finanzas-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    this.notif.notify('Respaldo exportado', 'Guárdalo en un lugar seguro (Drive, Files, etc.).');
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!confirm('Importar reemplaza todos los datos actuales de este dispositivo por los del respaldo. ¿Continuar?')) return;
    try {
      const text = await file.text();
      await this.store.importBackup(JSON.parse(text));
      this.notif.notify('Respaldo importado', 'Tus datos fueron restaurados.');
    } catch {
      alert('No se pudo leer ese archivo como respaldo de Finanzas.');
    }
  }
}
