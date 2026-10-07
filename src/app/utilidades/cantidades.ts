import { signal } from '@angular/core';

export class Cantidades {
  private cantidades = signal<ReadonlyMap<string, number>>(new Map());

  readonly valores = this.cantidades.asReadonly();

  de(id: string): number {
    return this.cantidades().get(id) ?? 0;
  }

  sumar(id: string) {
    this.cantidades.update((actuales) => new Map(actuales).set(id, (actuales.get(id) ?? 0) + 1));
  }

  restar(id: string) {
    this.cantidades.update((actuales) => {
      const siguientes = new Map(actuales);
      const actual = actuales.get(id) ?? 0;

      if (actual <= 1) {
        siguientes.delete(id);
      } else {
        siguientes.set(id, actual - 1);
      }

      return siguientes;
    });
  }
}
