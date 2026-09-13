import { Component, computed, inject, signal } from '@angular/core';
import { WorkoutService, ymd } from '../core/workout.service';
import { fmtDate } from '../ui/format';
import { HistoryPoint } from '../core/models';

@Component({
  selector: 'app-progress',
  template: `
  <div class="wrap">
    @if (withData().length) {
      <div class="card tight">
        <div class="lbl">Ejercicio</div>
        <select class="mt8" (change)="pick($any($event.target).value)">
          @for (e of withData(); track e.id) {
            <option [value]="e.id" [selected]="e.id === current()">{{ e.n }} · {{ e.dayName }}</option>
          }
        </select>
      </div>

      <div class="card">
        <div class="lbl">1RM estimado · Epley</div>
        @if (hist().length > 1) {
          <svg [attr.viewBox]="'0 0 320 132'" width="100%" style="height:132px;display:block" preserveAspectRatio="none">
            <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#8B5CF6" stop-opacity=".35" />
              <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" /></linearGradient></defs>
            <path [attr.d]="area()" fill="url(#gr)" />
            <path [attr.d]="line()" fill="none" stroke="#A78BFA" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
            @for (p of points(); track $index) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#A78BFA" /> }
            <text x="20" y="12" fill="#5E5E70" font-size="9">{{ maxLabel() }} kg</text>
            <text x="20" y="128" fill="#5E5E70" font-size="9">{{ minLabel() }} kg</text>
          </svg>
        } @else {
          <div class="empty p24">Con dos sesiones de este ejercicio ya aparece la curva.</div>
        }
        <div class="grid3 mt10">
          <div class="stat"><b class="num">{{ round(last()?.e1 ?? 0) }}</b><span>1RM est.</span></div>
          <div class="stat"><b class="num">{{ last()?.best?.w }}×{{ last()?.best?.r }}</b><span>Mejor serie</span></div>
          <div class="stat"><b class="num" [style.color]="delta() >= 0 ? 'var(--ok)' : 'var(--bad)'">{{ delta() >= 0 ? '+' : '' }}{{ delta().toFixed(1) }}%</b><span>Total</span></div>
        </div>
      </div>

      @if (currentEx(); as ex) {
        <div class="card">
          <div class="lbl">Qué hacer el próximo día</div>
          <div class="fb mt9" [class.g]="svc.advice(ex).k === 'up'" [class.w]="svc.advice(ex).k === 'down'">
            <b>{{ svc.advice(ex).t }}.</b> {{ svc.advice(ex).m }}
          </div>
          <div class="muted s12">{{ ex.w }}</div>
        </div>
      }

      <div class="card">
        <div class="lbl">Historial</div>
        <table class="log">
          @for (h of histDesc(); track h.date) {
            <tr><td class="w62">{{ fmtDate(h.date) }}</td>
              <td>{{ setsLabel(h) }}</td>
              <td class="right w42"><b class="num">{{ round(h.e1) }}</b></td></tr>
          }
        </table>
      </div>

      @if (weeks().length > 1) {
        <div class="card">
          <div class="lbl">Volumen semanal</div>
          <div class="bars">
            @for (w of weeks(); track w.k) {
              <div class="barcol">
                <div class="bari" [style.height.px]="barH(w.v)"></div>
                <div class="barl">{{ w.k.slice(8) }}/{{ w.k.slice(5, 7) }}</div>
              </div>
            }
          </div>
        </div>
      }
    } @else {
      <div class="empty"><div class="big">▲</div>Aún no hay datos.<br />Registra tu primer entreno y aquí verás la curva de cada ejercicio.</div>
    }
  </div>`,
})
export class ProgressPage {
  svc = inject(WorkoutService);
  fmtDate = fmtDate;
  round = (n: number) => Math.round(n);

  withData = computed(() => this.svc.allExercises().filter(e => this.svc.history(e.id).length));
  private picked = signal<string | null>(null);
  current = computed(() => {
    const list = this.withData();
    const p = this.picked();
    return p && list.some(e => e.id === p) ? p : (list[0]?.id ?? null);
  });
  currentEx = computed(() => this.withData().find(e => e.id === this.current()));
  hist = computed(() => (this.current() ? this.svc.history(this.current()!) : []));
  last = computed<HistoryPoint | undefined>(() => this.hist()[this.hist().length - 1]);
  delta = computed(() => {
    const h = this.hist();
    return h.length > 1 && h[0].e1 ? ((h[h.length - 1].e1 - h[0].e1) / h[0].e1) * 100 : 0;
  });
  histDesc = computed(() => this.hist().slice().reverse().slice(0, 14));
  pick(id: string) { this.picked.set(id); }
  setsLabel = (h: HistoryPoint) => h.sets.map(s => `${s.w}×${s.r}`).join(' · ');

  private bounds = computed(() => {
    const v = this.hist().map(x => x.e1);
    const mn = Math.min(...v) * 0.93, mx = Math.max(...v) * 1.05;
    return { mn, mx, rg: mx - mn || 1 };
  });
  maxLabel = () => Math.round(this.bounds().mx);
  minLabel = () => Math.round(this.bounds().mn);
  points = computed(() => {
    const h = this.hist(), b = this.bounds();
    return h.map((x, i) => ({
      x: +(20 + (i * (320 - 34)) / Math.max(1, h.length - 1)).toFixed(1),
      y: +(132 - 22 - ((x.e1 - b.mn) / b.rg) * (132 - 42)).toFixed(1),
    }));
  });
  line = () => this.points().map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' ');
  area = () => {
    const p = this.points();
    return p.length ? `${this.line()} L${p[p.length - 1].x} 114 L20 114 Z` : '';
  };

  weeks = computed(() => {
    const map: Record<string, number> = {};
    for (const s of this.svc.sessions()) {
      const d = new Date(s.date + 'T12:00:00');
      const mon = new Date(d);
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const k = ymd(mon);
      map[k] = (map[k] ?? 0) + this.svc.stats(s).vol;
    }
    return Object.keys(map).sort().slice(-8).map(k => ({ k, v: map[k] }));
  });
  barH = (v: number) => {
    const mx = Math.max(...this.weeks().map(w => w.v)) || 1;
    return Math.max(4, Math.round((v / mx) * 74));
  };
}
