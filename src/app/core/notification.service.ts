import { Injectable, signal } from '@angular/core';
import { SheetService } from '../shared/sheet.service';

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly permission = signal<NotifPermission>(this.currentPermission());
  readonly lastBanner = signal<{ title: string; body: string } | null>(null);

  constructor(private sheet: SheetService) {}

  private currentPermission(): NotifPermission {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as NotifPermission;
  }

  async requestPermission(): Promise<NotifPermission> {
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    this.permission.set(result as NotifPermission);
    return result as NotifPermission;
  }

  /** Fires a real OS notification when permitted; always shows the in-app banner too. */
  notify(title: string, body: string): void {
    this.lastBanner.set({ title, body });
    setTimeout(() => this.lastBanner.set(null), 4400);
    if (this.permission() === 'granted') {
      try {
        new Notification(title, { body, icon: 'icons/icon-192x192.png' });
        return;
      } catch {
        /* fall through to in-app toast */
      }
    }
    this.sheet.say(title + ': ' + body);
  }
}
