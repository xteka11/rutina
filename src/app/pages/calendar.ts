import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkoutService, ymd } from '../core/workout.service';
import { UiService } from '../ui/ui.service';
import { MONTHS } from '../core/default-routine';
import { fmtDate, fmtKg, pad } from '../ui/format';
import { num } from '../core/progression';
import { Session } from '../core/models';

@Component({
  selector: 'app-calendar',
  template: `
  <div class="wrap">
    <div class="calnav">
      <button (click)="move(-1)">‹</button>
      <div class="m">{{ MONTHS[ref().getMonth()] }} {{ ref().getFullYear() }}</div>
      <button (click)="move(1)">›</button>
    </div>
    <div class="card">
      <div class="cal">
        @for (d of dows; track d) { <div class="dow">{{ d }}</div> }
        @for (b of blanks(); track $index) { <div class="calc empty"></div> }
        @for (n of days(); track n) {
          <div class="calc" [class.has]="hasDay(n)" [class.today]="isToday(n)" (click)="hasDay(n) && select(n)">
            {{ n }}@if (hasDay(n)) { <div class="dot"></div> }
          </div>
        }
      </div>
    </div>
    <div class="grid3 my12">
      <div class="stat"><b class="num">{{ inMonth().length }}</b><span>Sesiones</span></div>
      <div class="stat"><b class="num">{{ monthSets() }}</b><span>Series</span></div>
      <div class="stat"><b class="num">{{ fmtKg(monthVol()) }}</b><span>Volumen</span></div>
    </div>

    @if (selected(); as k) {
      @for (s of sessionsOn(k); track s.date + s.dayId) {
        <div class="card">
          <div class="row">
            <div><div class="b15">{{ svc.day(s.dayId)?.name }}</div>
              <div class="s11">{{ fmtDate(s.date) }} · {{ svc.stats(s).sets }} series · {{ svc.stats(s).vol.toLocaleString('es') }} kg</div></div>
          </div>
          <table class="log">
            @for (e of svc.day(s.dayId)?.ex ?? []; track e.id) {
              @if (doneRows(s, e.id); as rr) {
                @if (rr.length) { <tr><td><b>{{ e.n }}</b><br /><span class="s11">{{ rr }}</span></td></tr> }
              }
            }
          </table>
          @if (s.notes) { <div class="notes">{{ s.notes }}</div> }
          <button class="btn danger sm mt12" (click)="askDelete(s)">Eliminar esta sesión</button>
        </div>
      }
    } @else if (inMonth().length) {
      <div class="lbl mt16 mb8">Detalle del mes</div>
      @for (s of inMonthDesc(); track s.date + s.dayId) {
        <div class="card tight row tap" (click)="selected.set(s.date)">
          <div><div class="b14">{{ svc.day(s.dayId)?.name }}</div>
            <div class="s11">{{ fmtDate(s.date) }} · {{ svc.stats(s).sets }} series</div></div>
          <div class="num b14 nowrap">{{ svc.stats(s).vol.toLocaleString('es') }} kg</div>
        </div>
      }
    } @else {
      <div class="empty">Sin entrenos registrados este mes.</div>
    }
    @if (selected()) { <button class="btn ghost" (click)="selected.set(null)">Ver el mes completo</button> }
  </div>`,
})
export class CalendarPage {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  private route = inject(ActivatedRoute);
  MONTHS = MONTHS; fmtDate = fmtDate; fmtKg = fmtKg;
  dows = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  ref = signal(new Date());
  selected = signal<string | null>(null);

  constructor() {
    const d = this.route.snapshot.queryParamMap.get('d');
    if (d) { this.selected.set(d); this.ref.set(new Date(d + 'T12:00:00')); }
  }
  move(x: number) {
    this.selected.set(null);
    this.ref.update(r => new Date(r.getFullYear(), r.getMonth() + x, 1));
  }
  private key = (n: number) => `${this.ref().getFullYear()}-${pad(this.ref().getMonth() + 1)}-${pad(n)}`;
  blanks = () => Array.from({ length: (new Date(this.ref().getFullYear(), this.ref().getMonth(), 1).getDay() + 6) % 7 });
  days = () => Array.from({ length: new Date(this.ref().getFullYear(), this.ref().getMonth() + 1, 0).getDate() }, (_, i) => i + 1);
  hasDay = (n: number) => this.svc.sessions().some(s => s.date === this.key(n));
  isToday = (n: number) => this.key(n) === ymd(new Date());
  select = (n: number) => this.selected.set(this.key(n));
  sessionsOn = (k: string) => this.svc.sessions().filter(s => s.date === k);
  inMonth = () => this.svc.sessions().filter(s => s.date.startsWith(`${this.ref().getFullYear()}-${pad(this.ref().getMonth() + 1)}`));
  inMonthDesc = () => this.inMonth().slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  monthVol = () => this.inMonth().reduce((a, s) => a + this.svc.stats(s).vol, 0);
  monthSets = () => this.inMonth().reduce((a, s) => a + this.svc.stats(s).sets, 0);

  doneRows(s: Session, exId: string): string {
    return (s.entries[exId] ?? []).filter(r => r.done && num(r.w) > 0)
      .map(r => `${num(r.w)}×${num(r.r)}${r.rir ? ' · RIR ' + r.rir : ''}`).join(' · ');
  }
  askDelete(s: Session) {
    this.ui.ask('Eliminar esta sesión', 'Desaparecerá del historial y de las gráficas de progresión.',
      'Eliminar', true, () => { this.svc.deleteSession(s.date, s.dayId); this.selected.set(null); this.ui.toast('Sesión eliminada'); });
  }
}
