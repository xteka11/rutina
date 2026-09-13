import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { UiService } from '../ui/ui.service';
import { RestTimerService } from '../ui/rest-timer.service';
import { StoreBanner } from '../ui/store-banner';
import { nextW, num, e1rm } from '../core/progression';
import { fmtDate } from '../ui/format';
import { Exercise } from '../core/models';

@Component({
  selector: 'app-session',
  imports: [StoreBanner],
  template: `
  @if (svc.active(); as a) {
  <div class="wrap">
    <app-store-banner />
    <div class="sticky">
      <div class="sbar">
        <div class="grow">
          <div class="nm">{{ svc.day(a.dayId)?.name }}</div>
          <div class="sub">{{ svc.stats(a).sets }}/{{ svc.stats(a).total }} series · {{ svc.stats(a).vol.toLocaleString('es') }} kg</div>
        </div>
        <div class="t"><b class="num">{{ minutes() }}'</b><span>MIN</span></div>
      </div>
      <div class="prog"><i [style.width.%]="pct(a)"></i></div>
    </div>

    @for (e of svc.day(a.dayId)?.ex ?? []; track e.id; let idx = $index) {
      <div class="ex" [class.done]="isFull(e)">
        <div class="ex-h" (click)="toggleOpen(e.id)">
          <div class="ex-i">{{ isFull(e) ? '✓' : idx + 1 }}</div>
          <div class="ex-t">
            <div class="n">{{ e.n }}</div>
            <div class="m">{{ rows(e).length }} series · {{ e.top[0] }}–{{ e.top[1] }} reps · {{ e.rest }}s</div>
            <div class="mt7">
              @if (svc.advice(e).k === 'up') { <span class="flag up">subir peso</span> }
              @if (svc.advice(e).k === 'down') { <span class="flag down">revisar</span> }
              @if (svc.advice(e).k === 'new') { <span class="flag hold">nuevo</span> }
              @if (isFull(e)) { <span class="flag ok">completo</span> }
              @else { <span class="s11">{{ doneCount(e) }}/{{ rows(e).length }} hechas</span> }
            </div>
          </div>
          <div class="caret">{{ open().includes(e.id) ? '▲' : '▼' }}</div>
        </div>

        @if (open().includes(e.id)) {
          <div class="ex-b">
            <div class="note"><b>{{ svc.advice(e).t }}.</b> {{ svc.advice(e).m }}</div>
            <div class="grid-row hdrow">
              <span>#</span><span>Anterior</span><span>kg</span><span>Reps</span><span></span>
            </div>
            @for (r of rows(e); track $index; let i = $index) {
              <div class="grid-row setrow" [class.top]="i === 0">
                <div class="sn">{{ i === 0 ? 'TOP' : i + 1 }}</div>
                <button class="prev" [class.has]="!!prevOf(e.id, i)" (click)="fill(e.id, i)">
                  {{ prevOf(e.id, i) || '–' }}
                </button>
                <input type="text" inputmode="decimal" enterkeyhint="next" placeholder="kg"
                       [class.filled]="r.w !== ''" [value]="r.w"
                       (input)="set(e.id, i, 'w', $any($event.target).value)"
                       (keydown.enter)="focusNext($event)" [attr.aria-label]="'Peso serie ' + (i + 1)" />
                <input type="text" inputmode="numeric" enterkeyhint="done"
                       [placeholder]="i === 0 ? e.top[0] + '-' + e.top[1] : e.back[0] + '-' + e.back[1]"
                       [class.filled]="r.r !== ''" [value]="r.r"
                       (input)="set(e.id, i, 'r', $any($event.target).value)"
                       (keydown.enter)="enterMark($event, e, i)" [attr.aria-label]="'Reps serie ' + (i + 1)" />
                <button class="chk" [class.on]="r.done" (click)="mark(e, i)" [attr.aria-label]="'Marcar serie ' + (i + 1)">✓</button>
              </div>
              @if (svc.cfg().rir) {
                <div class="rirrow">
                  <span>RIR</span>
                  <input type="text" inputmode="numeric" placeholder="–" [value]="r.rir"
                         (input)="set(e.id, i, 'rir', $any($event.target).value)" />
                </div>
              }
            }
            <div class="setctl">
              <button (click)="svc.addSet(e.id)">+ serie</button>
              <button (click)="svc.removeSet(e.id)">− serie</button>
            </div>
            <div class="cue"><b>Ejecución.</b> {{ e.c }}<br /><br /><b>Por qué está aquí.</b> {{ e.w }}</div>
          </div>
        }
      </div>
    }

    <div class="card">
      <div class="lbl">Notas de la sesión</div>
      <textarea class="mt9" placeholder="Sensaciones, molestias, cambios de máquina…"
                [value]="a.notes" (input)="svc.setNotes($any($event.target).value)"></textarea>
    </div>
    <button class="btn" (click)="finish()">Terminar y guardar</button>
    <button class="btn ghost sm" (click)="askDiscard()">Descartar este entreno</button>
    <div class="h8"></div>
  </div>
  } @else {
    <div class="wrap"><div class="empty"><div class="big">◎</div>No hay ningún entreno abierto.<br />Empieza uno desde Hoy.</div></div>
  }`,
})
export class SessionPage {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  timer = inject(RestTimerService);
  private router = inject(Router);
  fmtDate = fmtDate;

  open = signal<string[]>([]);
  minutes = signal(0);

  constructor() {
    const a = this.svc.active();
    if (a) this.open.set([this.svc.day(a.dayId)?.ex[0].id ?? '']);
    this.tick();
    setInterval(() => this.tick(), 15000);
  }
  private tick() {
    const a = this.svc.active();
    this.minutes.set(a ? Math.round((Date.now() - a.started) / 60000) : 0);
  }

  rows = (e: Exercise) => this.svc.active()?.entries[e.id] ?? [];
  doneCount = (e: Exercise) => this.rows(e).filter(r => r.done).length;
  isFull = (e: Exercise) => this.rows(e).length > 0 && this.doneCount(e) === this.rows(e).length;
  pct = (a: { entries: Record<string, unknown> }) => {
    const s = this.svc.stats(a as never);
    return s.total ? Math.round((s.sets / s.total) * 100) : 0;
  };
  prevOf(exId: string, i: number): string {
    const last = this.svc.lastFor(exId);
    if (!last) return '';
    const s = last.sets[i] ?? last.sets[last.sets.length - 1];
    return `${s.w}×${s.r}`;
  }

  toggleOpen(id: string) {
    this.open.update(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));
  }
  set(exId: string, i: number, f: 'w' | 'r' | 'rir', v: string) { this.svc.setField(exId, i, f, v); }
  fill(exId: string, i: number) { this.svc.fillFromPrevious(exId, i); }

  focusNext(ev: Event) {
    ev.preventDefault();
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.setrow input'));
    const i = inputs.indexOf(ev.target as HTMLInputElement);
    if (i > -1 && inputs[i + 1]) inputs[i + 1].focus();
  }
  enterMark(ev: Event, e: Exercise, i: number) {
    ev.preventDefault();
    (ev.target as HTMLInputElement).blur();
    this.mark(e, i);
  }

  mark(e: Exercise, i: number) {
    const res = this.svc.toggleSet(e.id, i);
    if (!res.marked) {
      const row = this.rows(e)[i];
      if (!row.done && (num(row.w) <= 0 || num(row.r) <= 0)) this.ui.toast('Apunta peso y repeticiones antes de marcar');
      return;
    }
    try { navigator.vibrate?.(28); } catch { /* sin vibración */ }
    if (res.pr) this.ui.toast('Récord personal · ' + e.n);
    if (this.svc.cfg().autoRest) this.timer.start(e.rest, e.n);
    if (res.completed) {
      const a = this.svc.active();
      const list = a ? this.svc.day(a.dayId)?.ex ?? [] : [];
      const idx = list.findIndex(x => x.id === e.id);
      const nx = list[idx + 1];
      this.open.update(l => l.filter(x => x !== e.id));
      if (nx) {
        this.open.update(l => [...l, nx.id]);
        setTimeout(() => document.getElementById('ex-' + nx.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
      }
    }
  }

  finish() {
    const a = this.svc.active();
    if (!a) return;
    const st = this.svc.stats(a);
    if (!st.sets) { this.ui.toast('No has marcado ninguna serie todavía'); return; }
    const prs: string[] = [], fb: string[] = [];
    for (const e of this.svc.day(a.dayId)?.ex ?? []) {
      const cur = (a.entries[e.id] ?? []).filter(x => x.done && num(x.w) > 0 && num(x.r) > 0)
        .map(x => ({ w: num(x.w), r: num(x.r) }));
      if (!cur.length) { fb.push(`No registraste nada en ${e.n}.`); continue; }
      const best = cur.reduce((p, x) => (e1rm(x.w, x.r) > e1rm(p.w, p.r) ? x : p));
      const bestEver = this.svc.bestEver(e.id);
      if (!bestEver) prs.push(`${e.n} · marca inicial ${best.w} kg × ${best.r}`);
      else if (e1rm(best.w, best.r) > bestEver.e1 * 1.002) prs.push(`${e.n} · ${best.w} kg × ${best.r}`);
      if (cur.every(x => x.r >= e.top[1])) fb.push(`Sube peso en ${e.n}: prueba ${nextW(best.w)} kg el próximo día.`);
      if (bestEver && e1rm(best.w, best.r) < bestEver.e1 * 0.93)
        fb.push(`${e.n} se quedó por debajo de tu mejor marca. Si se repite, revisa descanso y comida.`);
      if (cur.length < e.sets) fb.push(`Te faltaron series en ${e.n} (${cur.length} de ${e.sets}).`);
    }
    sessionStorage.setItem('rutina.summary', JSON.stringify({ prs, fb, st }));
    this.svc.finish();
    this.timer.stop();
    this.ui.toast('Entreno guardado');
    this.router.navigateByUrl('/resumen');
  }
  askDiscard() {
    this.ui.ask('Descartar el entreno', 'Se perderán las series que hayas registrado en esta sesión.',
      'Descartar', true, () => { this.svc.discard(); this.timer.stop(); this.ui.toast('Entreno descartado'); this.router.navigateByUrl('/'); });
  }
}
