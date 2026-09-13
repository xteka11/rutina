import { Exercise, HistoryPoint, Advice, Session } from './models';

/** Convierte "62,5" o "62.5" en número. Devuelve 0 si no es válido. */
export const num = (v: unknown): number => {
  if (v === '' || v == null) return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

/** 1RM estimado por la fórmula de Epley. */
export const e1rm = (w: number, r: number): number => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);

/** Siguiente salto de carga realista según el material. */
export const nextW = (w: number): number => {
  const step = w <= 12 ? 1 : w <= 30 ? 2 : w <= 60 ? 2.5 : 5;
  return Math.round((w + step) * 2) / 2;
};

/** Historial de un ejercicio, ordenado de más antiguo a más reciente. */
export function historyFor(sessions: Session[], exId: string): HistoryPoint[] {
  return sessions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map(s => {
      const sets = (s.entries[exId] ?? [])
        .filter(x => x.done && num(x.w) > 0 && num(x.r) > 0)
        .map(x => ({ w: num(x.w), r: num(x.r), rir: x.rir }));
      if (!sets.length) return null;
      const best = sets.reduce((a, x) => (e1rm(x.w, x.r) > e1rm(a.w, a.r) ? x : a));
      return {
        date: s.date,
        sets,
        best: { w: best.w, r: best.r },
        e1: e1rm(best.w, best.r),
        vol: sets.reduce((a, x) => a + x.w * x.r, 0),
      } as HistoryPoint;
    })
    .filter((x): x is HistoryPoint => x !== null);
}

/**
 * Recomendación de carga para el próximo día.
 * Doble progresión: se sube cuando TODAS las series llegan al tope del rango.
 */
export function adviceFor(ex: Exercise, hist: HistoryPoint[]): Advice {
  if (!hist.length) {
    return {
      k: 'new',
      t: 'Primera vez',
      m: `Estrena la carga como sueles: entra en ${Math.max(4, ex.top[0] - 2)}–${ex.top[0] - 1} reps si el peso es nuevo y trabájala hasta llegar a ${ex.top[1]}.`,
    };
  }
  const last = hist[hist.length - 1];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;

  if (last.sets.every(s => s.r >= ex.top[1])) {
    return {
      k: 'up',
      t: 'Sube peso',
      m: `Cerraste todas las series en ${ex.top[1]}+ reps con ${last.best.w} kg. Prueba ${nextW(last.best.w)} kg y entra de nuevo por la parte baja del rango.`,
    };
  }
  if (last.best.r >= ex.top[1]) {
    return {
      k: 'hold',
      t: 'Casi',
      m: `El top set ya llegó a ${last.best.r} reps con ${last.best.w} kg, pero las series de apoyo no. Mantén el peso y empújalas hasta ${ex.top[1]}.`,
    };
  }
  if (prev && last.e1 < prev.e1 * 0.96) {
    return {
      k: 'down',
      t: 'Rendimiento a la baja',
      m: `Por debajo del día anterior (1RM estimado ${Math.round(last.e1)} frente a ${Math.round(prev.e1)}). Una vez es ruido; dos semanas seguidas piden descarga.`,
    };
  }
  return {
    k: 'hold',
    t: 'Mantén el peso',
    m: `Sigue con ${last.best.w} kg y suma repeticiones hasta llegar a ${ex.top[1]} en todas las series.`,
  };
}
