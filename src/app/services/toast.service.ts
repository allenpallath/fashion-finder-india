import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'error' | 'info';
}

/** Short messages shown at the bottom of the screen (see ToastHostComponent). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly list = signal<Toast[]>([]);
  readonly toasts = this.list.asReadonly();

  /** Shows a message for `durationMs`. At most three are on screen; the oldest goes first. */
  show(message: string, kind: Toast['kind'] = 'error', durationMs = 6000): void {
    const toast = { id: this.nextId++, message, kind };
    this.list.update((list) => [...list.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  dismiss(id: number): void {
    this.list.update((list) => list.filter((t) => t.id !== id));
  }
}
