import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  readonly visible = signal(false);
  readonly pendingAction = signal<(() => void) | null>(null);

  open(afterAuth?: () => void): void {
    this.pendingAction.set(afterAuth ?? null);
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
    this.pendingAction.set(null);
  }

  completeAuth(): void {
    const action = this.pendingAction();
    this.close();
    action?.();
  }
}
