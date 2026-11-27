import { Injectable, signal } from '@angular/core';

/** Abre el asistente de perfil a pedido (p. ej. desde «Mi perfil»), además del aviso del primer ingreso. */
@Injectable({ providedIn: 'root' })
export class PerfilAsistenteService {
  private readonly abiertoSignal = signal(false);
  readonly abierto = this.abiertoSignal.asReadonly();

  abrir(): void {
    this.abiertoSignal.set(true);
  }

  cerrar(): void {
    this.abiertoSignal.set(false);
  }
}
