import { Component, inject } from '@angular/core';
import { WorkoutService } from '../core/workout.service';

@Component({
  selector: 'app-store-banner',
  template: `
  @if (!svc.storageOk()) {
    <div class="warnbar">
      <b>Guardado no disponible en este navegador.</b> La app funciona igual mientras la tengas abierta,
      pero el historial podría no conservarse al cerrarla. Exporta tus datos desde Plan → Copia de seguridad.
    </div>
  }`,
})
export class StoreBanner { svc = inject(WorkoutService); }
