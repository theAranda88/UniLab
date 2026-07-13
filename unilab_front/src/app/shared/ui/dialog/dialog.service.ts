import { Injectable, signal } from '@angular/core';

export type DialogType = 'confirm' | 'success' | 'warning' | 'error' | 'info';

export interface DialogConfig {
  type: DialogType;
  titleKey?: string;
  title?: string;
  messageKey?: string;
  message?: string;
  confirmKey?: string;
  cancelKey?: string;
  dismissible?: boolean;
  destructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly active = signal<DialogConfig | null>(null);

  private resolveFn: ((value: boolean) => void) | null = null;

  confirm(config: Omit<DialogConfig, 'type'>): Promise<boolean> {
    return this.open({ ...config, type: 'confirm', dismissible: config.dismissible ?? true });
  }

  success(config: Omit<DialogConfig, 'type'>): Promise<void> {
    return this.openAlert({ ...config, type: 'success', dismissible: config.dismissible ?? true });
  }

  warning(config: Omit<DialogConfig, 'type'>): Promise<void> {
    return this.openAlert({ ...config, type: 'warning', dismissible: config.dismissible ?? true });
  }

  error(config: Omit<DialogConfig, 'type'>): Promise<void> {
    return this.openAlert({ ...config, type: 'error', dismissible: config.dismissible ?? true });
  }

  info(config: Omit<DialogConfig, 'type'>): Promise<void> {
    return this.openAlert({ ...config, type: 'info', dismissible: config.dismissible ?? true });
  }

  private open(config: DialogConfig): Promise<boolean> {
    this.active.set(config);
    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  private openAlert(config: DialogConfig): Promise<void> {
    return this.open(config).then(() => undefined);
  }

  confirmAction(): void {
    const fn = this.resolveFn;
    this.resolveFn = null;
    this.active.set(null);
    fn?.(true);
  }

  cancelAction(): void {
    const fn = this.resolveFn;
    this.resolveFn = null;
    this.active.set(null);
    fn?.(false);
  }

  acknowledge(): void {
    const fn = this.resolveFn;
    this.resolveFn = null;
    this.active.set(null);
    fn?.(true);
  }
}
