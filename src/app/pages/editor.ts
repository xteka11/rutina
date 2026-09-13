import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { UiService } from '../ui/ui.service';
import { DAYNAMES } from '../core/default-routine';
import { Day, Exercise } from '../core/models';

@Component({
  selector: 'app-editor',
  imports: [FormsModule],
  template: `
  <div class="wrap">
    <div class="card">
      <div class="lbl">Editor de rutina</div>
      <div class="muted mt8 s13 lh155">
        Los cambios se guardan en el dispositivo y mandan sobre <code>default-routine.ts</code>.
        Cambiar el nombre o los rangos no borra tu historial; solo cambia el identificador si sabes lo que haces,
        porque es lo que enlaza cada ejercicio con sus marcas anteriores.
      </div>
    </div>

    @for (d of draft(); track d.id; let di = $index) {
      <details class="pd">
        <summary>
          <div><div>{{ d.name || 'Día sin nombre' }}</div><div class="s">{{ DAYNAMES[d.dow] }} · {{ d.ex.length }} ejercicios</div></div>
          <span class="s11 nowrap">editar</span>
        </summary>
        <div class="pd-body">
          <div class="frow"><label>Nombre</label><input [(ngModel)]="d.name" /></div>
          <div class="frow"><label>Subtítulo</label><input [(ngModel)]="d.sub" /></div>
          <div class="frow"><label>Día</label>
            <select [(ngModel)]="d.dow">
              @for (n of [1,2,3,4,5,6,0]; track n) { <option [value]="n">{{ DAYNAMES[n] }}</option> }
            </select>
          </div>
          <div class="frow"><label>Extra</label><input [(ngModel)]="d.extra" /></div>

          @for (e of d.ex; track e.id; let ei = $index) {
            <div class="edx">
              <div class="edx-h">
                <input class="grow" [(ngModel)]="e.n" />
                <button class="mini" (click)="move(d, ei, -1)" [disabled]="ei === 0">↑</button>
                <button class="mini" (click)="move(d, ei, 1)" [disabled]="ei === d.ex.length - 1">↓</button>
                <button class="mini danger" (click)="removeEx(d, ei)">✕</button>
              </div>
              <div class="edx-g">
                <label>Series<input type="number" min="1" max="10" [(ngModel)]="e.sets" /></label>
                <label>Top<input type="number" min="1" [(ngModel)]="e.top[0]" /></label>
                <label>a<input type="number" min="1" [(ngModel)]="e.top[1]" /></label>
                <label>Back<input type="number" min="1" [(ngModel)]="e.back[0]" /></label>
                <label>a<input type="number" min="1" [(ngModel)]="e.back[1]" /></label>
                <label>Desc. s<input type="number" min="15" step="15" [(ngModel)]="e.rest" /></label>
              </div>
              <textarea class="mt8" rows="2" placeholder="Ejecución" [(ngModel)]="e.c"></textarea>
              <textarea class="mt8" rows="2" placeholder="Por qué está aquí" [(ngModel)]="e.w"></textarea>
            </div>
          }
          <button class="btn ghost sm mt10" (click)="addEx(d)">+ Añadir ejercicio</button>
          <button class="btn danger sm" (click)="askRemoveDay(di)">Eliminar este día</button>
        </div>
      </details>
    }

    <button class="btn ghost" (click)="addDay()">+ Añadir día</button>
    <button class="btn" (click)="saveAll()">Guardar cambios</button>
    <button class="btn ghost sm" (click)="askReset()">Restaurar rutina original</button>
    <div class="h8"></div>
  </div>`,
})
export class EditorPage {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  private router = inject(Router);
  DAYNAMES = DAYNAMES;

  draft = signal<Day[]>(JSON.parse(JSON.stringify(this.svc.routine())));

  private slug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28) || 'ej_' + Date.now();

  addEx(d: Day) {
    const ex: Exercise = {
      id: this.slug('nuevo ' + Date.now()), n: 'Ejercicio nuevo', sets: 3,
      top: [8, 10], back: [8, 10], rest: 120, c: '', w: '',
    };
    d.ex.push(ex);
    this.draft.update(v => [...v]);
  }
  removeEx(d: Day, i: number) { d.ex.splice(i, 1); this.draft.update(v => [...v]); }
  move(d: Day, i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= d.ex.length) return;
    [d.ex[i], d.ex[j]] = [d.ex[j], d.ex[i]];
    this.draft.update(v => [...v]);
  }
  addDay() {
    this.draft.update(v => [...v, {
      id: 'dia_' + Date.now(), name: 'Día nuevo', sub: '', dow: 6, extra: '', ex: [],
    }]);
  }
  askRemoveDay(i: number) {
    this.ui.ask('Eliminar este día', 'Las sesiones ya registradas de ese día seguirán en el historial, pero dejarán de mostrarse.',
      'Eliminar', true, () => { this.draft.update(v => v.filter((_, k) => k !== i)); });
  }
  saveAll() {
    const clean = this.draft().map(d => ({
      ...d, dow: Number(d.dow),
      ex: d.ex.map(e => ({
        ...e, sets: Number(e.sets), rest: Number(e.rest),
        top: [Number(e.top[0]), Number(e.top[1])] as [number, number],
        back: [Number(e.back[0]), Number(e.back[1])] as [number, number],
      })),
    }));
    this.svc.updateRoutine(clean);
    this.ui.toast('Rutina guardada');
    this.router.navigateByUrl('/plan');
  }
  askReset() {
    this.ui.ask('Restaurar rutina original', 'Vuelve a la rutina de default-routine.ts. Tu historial de entrenos no se toca.',
      'Restaurar', true, () => { this.svc.resetRoutine(); this.draft.set(JSON.parse(JSON.stringify(this.svc.routine()))); this.ui.toast('Rutina restaurada'); });
  }
}
