import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { WorkoutService } from './core/workout.service';
import { UiService } from './ui/ui.service';
import { RestTimerService } from './ui/rest-timer.service';
import { pad } from './ui/format';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
  <div class="hd">
    <div>
      <div class="eyebrow">Hipertrofia · 5 días</div>
      <h1>{{ title() }}</h1>
    </div>
    <div class="chip">Semana <b>{{ svc.weekDone() }}/5</b></div>
  </div>

  <router-outlet />

  @if (timer.running()) {
    <div id="rest">
      <div class="rest-in">
        <div class="t num">{{ mmss() }}</div>
        <div class="l">
          <div class="nm">Descanso · {{ timer.label() }}</div>
          <div class="bar"><i [style.width.%]="restPct()"></i></div>
        </div>
        <button (click)="timer.add(30)">+30s</button>
        <button (click)="timer.stop()">Saltar</button>
      </div>
    </div>
  }

  @if (ui.toastMsg()) { <div id="toast">{{ ui.toastMsg() }}</div> }

  @if (ui.confirmData(); as c) {
    <div class="sheet" (click)="ui.close()">
      <div class="sheet-in" (click)="$event.stopPropagation()">
        <div class="grab"></div>
        <h2>{{ c.title }}</h2>
        <p class="msg">{{ c.msg }}</p>
        <button class="btn" [class.solid-danger]="c.danger" (click)="ui.accept()">{{ c.okLabel }}</button>
        <button class="btn ghost" (click)="ui.close()">Cancelar</button>
      </div>
    </div>
  }

  <div class="nav">
    <div class="nav-in">
      <a routerLink="/" [class.on]="isTab('/')"><span class="ic">◆</span>Hoy</a>
      <a routerLink="/calendario" [class.on]="isTab('/calendario')"><span class="ic">▦</span>Calendario</a>
      <a routerLink="/progreso" [class.on]="isTab('/progreso')"><span class="ic">▲</span>Progreso</a>
      <a routerLink="/plan" [class.on]="isTab('/plan')"><span class="ic">☰</span>Plan</a>
    </div>
  </div>`,
})
export class App {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  timer = inject(RestTimerService);
  private router = inject(Router);

  url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: '/' }
  );

  private titles: Record<string, string> = {
    '/': 'Hoy', '/entreno': 'Entreno', '/resumen': 'Resumen',
    '/calendario': 'Calendario', '/progreso': 'Progreso', '/plan': 'Tu plan', '/editor': 'Editor',
  };
  title = computed(() => this.titles[this.url().split('?')[0]] ?? 'Hoy');
  isTab = (p: string) => {
    const u = this.url().split('?')[0];
    return p === '/' ? u === '/' || u === '/entreno' || u === '/resumen' : u === p;
  };

  mmss = computed(() => `${Math.floor(this.timer.left() / 60)}:${pad(this.timer.left() % 60)}`);
  restPct = computed(() => (this.timer.total() ? (this.timer.left() / this.timer.total()) * 100 : 0));

  constructor() {
    this.timer.onFinish = (label) => this.ui.toast('Descanso terminado · ' + label);
  }
}
