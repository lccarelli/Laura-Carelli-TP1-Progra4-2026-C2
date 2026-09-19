import { Service, signal, WritableSignal } from '@angular/core';

@Service()
export class Errores {
  public mensaje: WritableSignal<string | null> = signal(null);

  mostrar(mensaje: string) {
    this.mensaje.set(mensaje);
    setTimeout(() => this.mensaje.set(null), 5000);
  }
}
