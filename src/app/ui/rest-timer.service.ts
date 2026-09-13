import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RestTimerService {
  left = signal(0);
  total = signal(0);
  label = signal('');
  running = signal(false);
  onFinish?: (label: string) => void;
  private int: ReturnType<typeof setInterval> | null = null;

  start(seconds: number, label: string) {
    this.stop();
    this.total.set(seconds); this.left.set(seconds); this.label.set(label); this.running.set(true);
    this.int = setInterval(() => {
      const v = this.left() - 1;
      if (v <= 0) {
        const l = this.label();
        this.stop();
        try { navigator.vibrate?.([150, 80, 150]); } catch { /* sin vibración */ }
        this.onFinish?.(l);
      } else this.left.set(v);
    }, 1000);
  }
  add(sec: number) { this.left.update(v => v + sec); this.total.update(v => v + sec); }
  stop() {
    if (this.int) clearInterval(this.int);
    this.int = null; this.running.set(false); this.left.set(0);
  }
}
