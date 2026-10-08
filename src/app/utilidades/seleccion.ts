import { computed, signal } from '@angular/core';

export class Seleccion {
  private elegidos = signal<ReadonlySet<string>>(new Set());

  readonly cantidad = computed(() => this.elegidos().size);

  tiene(id: string): boolean {
    return this.elegidos().has(id);
  }

  ids(): string[] {
    return [...this.elegidos()];
  }

  alternar(id: string) {
    this.elegidos.update((actuales) => {
      const siguientes = new Set(actuales);

      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }

      return siguientes;
    });
  }

  incluye(ids: string[]): boolean {
    return ids.length > 0 && ids.every((id) => this.tiene(id));
  }

  alternarTodos(ids: string[]) {
    this.elegidos.set(this.incluye(ids) ? new Set() : new Set(ids));
  }

  limpiar() {
    this.elegidos.set(new Set());
  }
}
