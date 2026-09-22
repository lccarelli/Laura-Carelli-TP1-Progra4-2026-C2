import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estrellas',
})
export class EstrellasPipe implements PipeTransform {
  transform(puntaje: number): string {
    return '★'.repeat(puntaje) + '☆'.repeat(5 - puntaje);
  }
}
