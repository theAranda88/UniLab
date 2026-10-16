import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  /** Clave i18n del mensaje. */
  messageKey: string;
}

const DURATION_MS = 2600;

/** C19 · Avisos cortos de confirmación (abajo a la derecha, se ocultan solos). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  success(messageKey: string): void {
    this.show('success', messageKey);
  }

  error(messageKey: string): void {
    this.show('error', messageKey);
  }

  info(messageKey: string): void {
    this.show('info', messageKey);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: ToastType, messageKey: string): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list, { id, type, messageKey }]);
    window.setTimeout(() => this.dismiss(id), DURATION_MS);
  }
}
