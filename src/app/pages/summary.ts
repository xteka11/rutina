import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-summary',
  template: `
  <div class="wrap">
    <div class="hero">
      <div class="lbl acc">Sesión completada</div>
      <h2>{{ st.vol.toLocaleString('es') }} kg</h2>
      <p>{{ st.sets }} de {{ st.total }} series · {{ st.reps }} repeticiones</p>
    </div>
    @if (prs.length) {
      <div class="lbl mb8">Récords de hoy</div>
      @for (p of prs; track p) { <div class="fb g">{{ p }}</div> }
    }
    <div class="lbl mt14 mb8">Feedback</div>
    @if (fb.length) { @for (f of fb; track f) { <div class="fb">{{ f }}</div> } }
    @else { <div class="fb">Sesión sólida y sin banderas rojas. Mantén las cargas y persigue una repetición más la semana que viene.</div> }
    @if (st.sets < st.total) {
      <div class="fb w">Has dejado {{ st.total - st.sets }} series sin marcar. Si fue por tiempo, recorta el último ejercicio antes que hacer todo a medias.</div>
    }
    <button class="btn mt14" (click)="go()">Volver a Hoy</button>
  </div>`,
})
export class SummaryPage {
  private router = inject(Router);
  private data = JSON.parse(sessionStorage.getItem('rutina.summary') ?? '{"prs":[],"fb":[],"st":{"sets":0,"total":0,"reps":0,"vol":0}}');
  prs: string[] = this.data.prs;
  fb: string[] = this.data.fb;
  st: { sets: number; total: number; reps: number; vol: number } = this.data.st;
  go() { this.router.navigateByUrl('/'); }
}
