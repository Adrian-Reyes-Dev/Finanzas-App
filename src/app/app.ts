import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { FinanceStore } from './core/finance.store';
import { UpdateService } from './core/update.service';
import { AccountSheet } from './shared/account-sheet/account-sheet';
import { AddTxSheet } from './shared/add-tx-sheet/add-tx-sheet';
import { GoalSheet } from './shared/goal-sheet/goal-sheet';
import { SheetService } from './shared/sheet.service';
import { SubSheet } from './shared/sub-sheet/sub-sheet';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AddTxSheet, AccountSheet, SubSheet, GoalSheet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly tabs = [
    { path: '/', label: 'Inicio' },
    { path: '/gastos', label: 'Gastos' },
    { path: '/ahorro', label: 'Ahorro' },
    { path: '/saldo', label: 'Saldo' },
    { path: '/subs', label: 'Subs' },
  ];

  readonly title = signal('Inicio');
  readonly pendingCount = computed(() => (this.store.prefs().subs ? this.store.upcomingSubs().filter((u) => u.sub.remind > 0 && u.days <= u.sub.remind && u.days >= 0).length : 0));

  constructor(
    public store: FinanceStore,
    public sheet: SheetService,
    private router: Router,
    private route: ActivatedRoute,
    updates: UpdateService,
  ) {
    void updates;
    this.store.init().then(() => this.store.checkReminders());
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => {
          let r = this.route;
          while (r.firstChild) r = r.firstChild;
          return (r.snapshot.data['title'] as string) ?? 'Finanzas';
        }),
      )
      .subscribe((t) => this.title.set(t));
  }
}
