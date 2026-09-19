import { Service } from '@angular/core';
import { Flujo } from './flujo';
import { TipoEvento } from './tipo-evento';

@Service()
export class Logger {
  registrar(flujo: Flujo, evento: TipoEvento, detalle?: string) {
    const hora = new Date().toLocaleTimeString();
    console.log(`[${hora}] [${flujo}] ${evento}${detalle ? ': ' + detalle : ''}`);
  }
}
