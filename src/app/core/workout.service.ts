import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { DEFAULT_ROUTINE } from './default-routine';
import { Cfg, Day, Exercise, HistoryPoint, Session, SetLog } from './models';
import { adviceFor, historyFor, num, e1rm } from './progression';

const K = { routine: 'rutina.routine', sessions: 'rutina.sessions', active: 'rutina.active', cfg: 'rutina.cfg' };

export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private store = inject(StorageService);

  routine = signal<Day[]>(this.store.read<Day[]>(K.routine, DEFAULT_ROUTINE));
  sessions = signal<Session[]>(this.store.read<Session[]>(K.sessions, []));
  active = signal<Session | null>(this.store.read<Session | null>(K.active, null));
  cfg = signal<Cfg>(this.store.read<Cfg>(K.cfg, { rir: false, autoRest: true }));

  storageOk = signal(true);

  /** Todos los ejercicios de la rutina con el día al que pertenecen. */
  allExercises = computed(() =>
    this.routine().flatMap(d => d.ex.map(e => ({ ...e, dayId: d.id, dayName: d.name })))
  );

  weekDone = computed(() => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    return this.sessions().filter(s => new Date(s.date + 'T12:00:00') >= mon).length;
  });

  totalVolume = computed(() => this.sessions().reduce((a, s) => a + this.stats(s).vol, 0));

  constructor() {
    effect(() => { this.store.write(K.routine, this.routine()); this.syncOk(); });
    effect(() => { this.store.write(K.sessions, this.sessions()); this.syncOk(); });
    effect(() => { this.store.write(K.active, this.active()); this.syncOk(); });
    effect(() => { this.store.write(K.cfg, this.cfg()); this.syncOk(); });
  }
  private syncOk() { if (this.storageOk() !== this.store.ok) this.storageOk.set(this.store.ok); }

  day = (id: string): Day | undefined => this.routine().find(d => d.id === id);
  exercise = (id: string): Exercise | undefined => this.allExercises().find(e => e.id === id);
  todayPlan = (): Day | undefined => this.routine().find(d => d.dow === new Date().getDay());

  history = (exId: string): HistoryPoint[] => historyFor(this.sessions(), exId);
  lastFor = (exId: string): HistoryPoint | null => { const h = this.history(exId); return h.length ? h[h.length - 1] : null; };
  bestEver = (exId: string): HistoryPoint | null => {
    const h = this.history(exId);
    return h.length ? h.reduce((a, x) => (x.e1 > a.e1 ? x : a)) : null;
  };
  advice = (ex: Exercise) => adviceFor(ex, this.history(ex.id));

  stats(s: Session) {
    const d = this.day(s.dayId);
    if (!d) return { sets: 0, vol: 0, reps: 0, total: 0 };
    let sets = 0, vol = 0, reps = 0, total = 0;
    for (const e of d.ex) {
      const rows = s.entries[e.id] ?? [];
      total += rows.length || e.sets;
      for (const x of rows) {
        const w = num(x.w), r = num(x.r);
        if (x.done && w > 0 && r > 0) { sets++; vol += w * r; reps += r; }
      }
    }
    return { sets, vol: Math.round(vol), reps, total };
  }

  // ── sesión ────────────────────────────────────────────────
  start(dayId: string) {
    const d = this.day(dayId);
    if (!d) return;
    const entries: Record<string, SetLog[]> = {};
    for (const e of d.ex) {
      entries[e.id] = Array.from({ length: e.sets }, () => ({ w: '', r: '', rir: '', done: false }));
    }
    this.active.set({ date: ymd(new Date()), dayId, started: Date.now(), entries, notes: '' });
  }

  private mutate(fn: (s: Session) => void) {
    const a = this.active();
    if (!a) return;
    const copy: Session = JSON.parse(JSON.stringify(a));
    fn(copy);
    this.active.set(copy);
  }

  setField(exId: string, i: number, field: 'w' | 'r' | 'rir', value: string) {
    this.mutate(s => { s.entries[exId][i][field] = value; });
  }
  fillFromPrevious(exId: string, i: number) {
    const last = this.lastFor(exId);
    if (!last) return;
    const src = last.sets[i] ?? last.sets[last.sets.length - 1];
    this.mutate(s => { s.entries[exId][i].w = String(src.w); s.entries[exId][i].r = String(src.r); });
  }
  addSet(exId: string) { this.mutate(s => { s.entries[exId].push({ w: '', r: '', rir: '', done: false }); }); }
  removeSet(exId: string) { this.mutate(s => { if (s.entries[exId].length > 1) s.entries[exId].pop(); }); }
  setNotes(v: string) { this.mutate(s => { s.notes = v; }); }

  /** Devuelve true si la serie quedó marcada (para arrancar el descanso). */
  toggleSet(exId: string, i: number): { marked: boolean; pr: boolean; completed: boolean } {
    const a = this.active();
    if (!a) return { marked: false, pr: false, completed: false };
    const row = a.entries[exId][i];
    if (row.done) { this.mutate(s => { s.entries[exId][i].done = false; }); return { marked: false, pr: false, completed: false }; }
    const w = num(row.w), r = num(row.r);
    if (w <= 0 || r <= 0) return { marked: false, pr: false, completed: false };
    const best = this.bestEver(exId);
    const pr = !!best && e1rm(w, r) > best.e1 * 1.002;
    this.mutate(s => { s.entries[exId][i].done = true; });
    const rows = this.active()!.entries[exId];
    return { marked: true, pr, completed: rows.every(x => x.done) };
  }

  finish() {
    const a = this.active();
    if (!a) return;
    a.finished = Date.now();
    this.sessions.update(list =>
      [...list.filter(x => !(x.date === a.date && x.dayId === a.dayId)), JSON.parse(JSON.stringify(a))]
    );
    this.active.set(null);
  }
  discard() { this.active.set(null); }
  deleteSession(date: string, dayId: string) {
    this.sessions.update(l => l.filter(s => !(s.date === date && s.dayId === dayId)));
  }
  wipe() { this.sessions.set([]); this.active.set(null); }

  // ── editor de rutina ──────────────────────────────────────
  updateRoutine(days: Day[]) { this.routine.set(JSON.parse(JSON.stringify(days))); }
  resetRoutine() { this.routine.set(JSON.parse(JSON.stringify(DEFAULT_ROUTINE))); }

  // ── copia de seguridad ────────────────────────────────────
  exportAll(): string {
    return JSON.stringify({ v: 1, routine: this.routine(), sessions: this.sessions(), cfg: this.cfg() }, null, 2);
  }
  importAll(raw: string): { ok: boolean; msg: string } {
    try {
      const p = JSON.parse(raw);
      if (!p || !Array.isArray(p.sessions)) return { ok: false, msg: 'El archivo no tiene el formato esperado.' };
      if (Array.isArray(p.routine) && p.routine.length) this.routine.set(p.routine);
      this.sessions.set(p.sessions);
      if (p.cfg) this.cfg.set({ rir: false, autoRest: true, ...p.cfg });
      return { ok: true, msg: `Importadas ${p.sessions.length} sesiones.` };
    } catch {
      return { ok: false, msg: 'No se ha podido leer el archivo.' };
    }
  }
}
