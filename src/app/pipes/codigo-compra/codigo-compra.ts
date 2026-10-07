import { Pipe, PipeTransform } from '@angular/core';
import { formatearCodigo } from '../../utilidades/codigo-compra';

@Pipe({
  name: 'codigoCompra',
})
export class CodigoCompraPipe implements PipeTransform {
  transform(codigo: string | null): string {
    return codigo ? formatearCodigo(codigo) : '';
  }
}
