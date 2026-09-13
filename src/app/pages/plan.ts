import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { UiService } from '../ui/ui.service';
import { DAYNAMES } from '../core/default-routine';

@Component({
  selector: 'app-plan',
  imports: [RouterLink],
  template: `
  <div class="wrap">
    <div class="card">
      <div class="lbl">Por qué frecuencia 1 de pierna funciona</div>
      <div class="muted mt8 lh155">
        Lo que manda en hipertrofia es el <b class="hi">volumen semanal efectivo</b>, no en cuántos días lo repartes.
        Con el volumen igualado, la diferencia entre frecuencia 1 y 2 es pequeña. Por eso tu día de pierna sube de 15
        a 21 series y se queda en un solo día, con dos condiciones: que las últimas series no se hagan a medias y que
        el gemelo salga de ahí para no alargarlo.
      </div>
    </div>
    <div class="card">
      <div class="lbl">El método</div>
      <div class="muted mt8 lh155">
        Doble progresión con tu rotación de cargas: estrena a 5–6 reps, trabaja hasta 9, y sube cuando la carga alta
        llegue a 9 y la rotada a 9–10. Alterna entre dos pesos cercanos mientras <b class="hi">anotes los dos</b>.
        Compuestos a RIR 0–1 en el top set y 1–2 en las back-off. Aislamiento al fallo en la última.
        El rumano nunca al fallo: RIR 2–3.
      </div>
    </div>

    <div class="card">
      <div class="lbl">Ajustes</div>
      <div class="sw">
        <div class="t">Registrar RIR<div class="s11">Añade un campo extra por serie</div></div>
        <button class="tog" [class.on]="svc.cfg().rir" (click)="toggle('rir')"><i></i></button>
      </div>
      <div class="sw bt">
        <div class="t">Cronómetro automático<div class="s11">Arranca al marcar cada serie</div></div>
        <button class="tog" [class.on]="svc.cfg().autoRest" (click)="toggle('autoRest')"><i></i></button>
      </div>
    </div>

    <button class="btn ghost" routerLink="/editor">Editar la rutina</button>

    <div class="lbl mt18 mb9">La semana · toca para desplegar</div>
    @for (d of svc.routine(); track d.id) {
      <details class="pd">
        <summary>
          <div><div>{{ d.name }}</div><div class="s">{{ DAYNAMES[d.dow] }} · {{ d.sub }}</div></div>
          <span class="s11 nowrap">{{ totalSets(d.id) }} series</span>
        </summary>
        <div class="pd-body">
          @for (e of d.ex; track e.id) {
            <div class="pd-ex">
              <div class="n">{{ e.n }}</div>
              <div class="d">{{ e.sets }} × {{ e.top[0] }}–{{ e.top[1] }} reps · descanso {{ e.rest >= 60 ? (e.rest / 60) + ' min' : e.rest + ' s' }}</div>
              <div class="c">{{ e.c }}</div>
              <div class="w">{{ e.w }}</div>
            </div>
          }
          <div class="extra">{{ d.extra }}</div>
        </div>
      </details>
    }

    <div class="card mt14">
      <div class="lbl">Copia de seguridad</div>
      <div class="muted s12 my10">
        {{ svc.sessions().length }} sesiones guardadas. Exporta de vez en cuando: iOS puede borrar los datos de una
        app instalada si pasas semanas sin abrirla.
      </div>
      <button class="btn ghost sm" (click)="download()">Descargar copia (.json)</button>
      <button class="btn ghost sm" (click)="file.click()">Importar copia</button>
      <input #file type="file" accept="application/json" hidden (change)="importFile($event)" />
      <button class="btn danger sm" (click)="askWipe()">Borrar todo el historial</button>
    </div>
    <div class="h8"></div>
  </div>`,
})
export class PlanPage {
  svc = inject(WorkoutService);
  ui = inject(UiService);
  DAYNAMES = DAYNAMES;

  totalSets = (id: string) => this.svc.day(id)?.ex.reduce((a, e) => a + e.sets, 0) ?? 0;
  toggle(k: 'rir' | 'autoRest') { this.svc.cfg.update(c => ({ ...c, [k]: !c[k] })); }

  download() {
    const blob = new Blob([this.svc.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rutina-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.ui.toast('Copia descargada');
  }
  importFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = this.svc.importAll(String(reader.result));
      this.ui.toast(res.msg);
    };
    reader.readAsText(f);
  }
  askWipe() {
    this.ui.ask('Borrar todo el historial', 'Se eliminan todas tus sesiones. Esta acción no se puede deshacer.',
      'Borrar todo', true, () => { this.svc.wipe(); this.ui.toast('Historial borrado'); });
  }
}
