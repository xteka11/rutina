import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { UiService } from '../ui/ui.service';
import { DAYNAMES } from '../core/default-routine';
import { StoreBanner } from '../ui/store-banner';
import { fmtDate, fmtKg } from '../ui/format';

@Component({
  selector: 'app-today',
  imports: [StoreBanner],
  template: `
  <div class="wrap">
    <app-store-banner />

    @if (svc.active(); as a) {
      <div class="hero">
        <div class="lbl acc">Sesión abierta</div>
        <h2>{{ svc.day(a.dayId)?.name }}</h2>
        <p>{{ svc.day(a.dayId)?.sub }}</p>
        <div class="meta">
          <div><b class="num">{{ svc.stats(a).sets }}/{{ svc.stats(a).total }}</b>series</div>
          <div><b class="num">{{ svc.stats(a).vol.toLocaleString('es') }}</b>kg movidos</div>
        </div>
      </div>
      <button class="btn" (click)="go('/entreno')">Continuar entreno</button>
      <button class="btn ghost sm" (click)="askDiscard()">Descartar este entreno</button>
    } @else if (today) {
      <div class="hero">
        <div class="lbl acc">{{ dayName }} · toca hoy</div>
        <h2>{{ today.name }}</h2>
        <p>{{ today.sub }}</p>
        <div class="meta">
          <div><b class="num">{{ today.ex.length }}</b>ejercicios</div>
          <div><b class="num">{{ totalSets }}</b>series</div>
          <div><b class="num">~{{ mins }}'</b>duración</div>
        </div>
      </div>
      <button class="btn" (click)="start(today.id)">Empezar {{ today.name }}</button>
      <div class="card tight">
        <div class="lbl">Extra de hoy</div>
        <div class="muted mt6">{{ today.extra }}</div>
      </div>
    } @else {
      <div class="hero">
        <div class="lbl acc">{{ dayName }}</div>
        <h2>Descanso</h2>
        <p>{{ restText }}</p>
      </div>
    }

    <div class="grid3 my14">
      <div class="stat"><b class="num">{{ svc.weekDone() }}/5</b><span>Semana</span></div>
      <div class="stat"><b class="num">{{ svc.sessions().length }}</b><span>Entrenos</span></div>
      <div class="stat"><b class="num">{{ fmtKg(svc.totalVolume()) }}</b><span>Volumen</span></div>
    </div>

    <div class="lbl mb8">Entrenar otro día</div>
    <div class="pick">
      @for (d of svc.routine(); track d.id) {
        <button (click)="start(d.id)"><span class="t">{{ d.name }}</span><span class="s">{{ d.sub }}</span></button>
      }
    </div>

    @if (recent().length) {
      <div class="lbl mt18 mb8">Últimas sesiones</div>
      @for (s of recent(); track s.date + s.dayId) {
        <div class="card tight row tap" (click)="openDay(s.date)">
          <div>
            <div class="b14">{{ svc.day(s.dayId)?.name }}</div>
            <div class="s11">{{ fmtDate(s.date) }} · {{ svc.stats(s).sets }} series</div>
          </div>
          <div class="num b14 nowrap">{{ svc.stats(s).vol.toLocaleString('es') }} kg</div>
        </div>
      }
    }
  </div>`,
})
export class TodayPage {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  private router = inject(Router);
  fmtKg = fmtKg; fmtDate = fmtDate;

  today = this.svc.todayPlan();
  dayName = DAYNAMES[new Date().getDay()];
  totalSets = this.today?.ex.reduce((a, e) => a + e.sets, 0) ?? 0;
  mins = Math.round((this.today?.ex.reduce((a, e) => a + e.sets * (e.rest + 42), 0) ?? 0) / 60) + 10;
  restText = new Date().getDay() === 6
    ? 'Movilidad completa 20–25 min. Intervalos opcionales si el viernes no te dejó tocado.'
    : 'Caminata de 40–60 min y estiramiento suave.';

  recent = () => this.svc.sessions().slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  go = (p: string) => this.router.navigateByUrl(p);
  openDay = (d: string) => this.router.navigate(['/calendario'], { queryParams: { d } });

  start(id: string) {
    if (this.svc.active()) {
      this.ui.ask('Tienes un entreno sin terminar', 'Si empiezas otro, el actual se descarta y no se guardará.',
        'Descartar y empezar', true, () => { this.svc.start(id); this.go('/entreno'); });
    } else { this.svc.start(id); this.go('/entreno'); }
  }
  askDiscard() {
    this.ui.ask('Descartar el entreno', 'Se perderán las series que hayas registrado en esta sesión.',
      'Descartar', true, () => { this.svc.discard(); this.ui.toast('Entreno descartado'); });
  }
}
