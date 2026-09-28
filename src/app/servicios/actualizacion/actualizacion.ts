import { inject, Service, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Service()
export class Actualizacion {
  private swUpdate = inject(SwUpdate);
  disponible = signal(false);

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(() => this.disponible.set(true));
  }

  actualizar() {
    document.location.reload();
  }
}
