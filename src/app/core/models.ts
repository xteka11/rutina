/** Tipos compartidos de toda la app. */
export interface Exercise {
  id: string;
  n: string;                    // nombre visible
  sets: number;                 // series objetivo
  top: [number, number];        // rango de reps del top set
  back: [number, number];       // rango de reps de las back-off
  rest: number;                 // descanso en segundos
  c: string;                    // cómo ejecutarlo
  w: string;                    // por qué está en la rutina
}

export interface Day {
  id: string;
  name: string;
  sub: string;
  dow: number;                  // 0 domingo … 6 sábado
  extra: string;                // cardio o movilidad del día
  ex: Exercise[];
}

export interface SetLog { w: string; r: string; rir: string; done: boolean; }

export interface Session {
  date: string;                 // YYYY-MM-DD
  dayId: string;
  started: number;
  finished?: number;
  notes: string;
  entries: Record<string, SetLog[]>;
}

export interface Cfg { rir: boolean; autoRest: boolean; }

export interface HistoryPoint {
  date: string;
  sets: { w: number; r: number; rir: string }[];
  best: { w: number; r: number };
  e1: number;
  vol: number;
}

export type AdviceKind = 'new' | 'up' | 'hold' | 'down';
export interface Advice { k: AdviceKind; t: string; m: string; }
