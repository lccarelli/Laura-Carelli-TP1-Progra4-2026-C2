import { Pipe, PipeTransform } from '@angular/core';

const NOMBRES_DIA: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

@Pipe({
  name: 'diasValidos',
})
export class DiasValidosPipe implements PipeTransform {
  transform(dias: number[] | null): string {
    if (!dias || dias.length === 0) {
      return 'Todos los días';
    }

    return dias
      .slice()
      .sort((a, b) => a - b)
      .map((dia) => NOMBRES_DIA[dia])
      .join(', ');
  }
}
