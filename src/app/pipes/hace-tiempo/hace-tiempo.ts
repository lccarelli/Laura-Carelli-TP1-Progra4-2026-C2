import { Pipe, PipeTransform } from '@angular/core';

const UNIDADES: { segundos: number; singular: string; plural: string }[] = [
  { segundos: 86400, singular: 'día', plural: 'días' },
  { segundos: 3600, singular: 'hora', plural: 'horas' },
  { segundos: 60, singular: 'minuto', plural: 'minutos' },
];

@Pipe({
  name: 'haceTiempo',
})
export class HaceTiempoPipe implements PipeTransform {
  transform(fecha: string | null, ahora = new Date()): string {
    if (!fecha) {
      return 'Sin sincronizar';
    }

    const segundos = Math.max(0, Math.floor((ahora.getTime() - new Date(fecha).getTime()) / 1000));

    for (const { segundos: base, singular, plural } of UNIDADES) {
      const cantidad = Math.floor(segundos / base);

      if (cantidad >= 1) {
        return `Actualizado hace ${cantidad} ${cantidad === 1 ? singular : plural}`;
      }
    }

    return 'Actualizado hace instantes';
  }
}
