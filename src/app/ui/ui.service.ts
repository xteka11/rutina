import { Injectable, signal } from '@angular/core';

export interface ConfirmData {
  title: string; msg: string; okLabel: string; danger: boolean; onOk: () => void;
}

/** Diálogos y avisos propios: confirm() nativo no es fiable dentro de una PWA. */
@Injectable({ providedIn: 'root' })
export class UiService {
  confirmData = signal<ConfirmData | null>(null);
  toastMsg = signal<string>('');
  private toastT: ReturnType<typeof setTimeout> | null = null;

  ask(title: string, msg: string, okLabel: string, danger: boolean, onOk: () => void) {
    this.confirmData.set({ title, msg, okLabel, danger, onOk });
  }
  close() { this.confirmData.set(null); }
  accept() {
    const d = this.confirmData();
    this.confirmData.set(null);
    d?.onOk();
  }
  toast(msg: string) {
    this.toastMsg.set(msg);
    if (this.toastT) clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toastMsg.set(''), 2600);
  }
}
