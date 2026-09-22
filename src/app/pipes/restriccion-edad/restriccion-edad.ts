import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'restriccionEdad',
})
export class RestriccionEdadPipe implements PipeTransform {
  transform(restriccionEdad: number | null): string {
    return restriccionEdad ? `+${restriccionEdad}` : 'Sin restricción';
  }
}
