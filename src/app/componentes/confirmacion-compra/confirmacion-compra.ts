import { Component, input } from '@angular/core';
import { CodigoCompraPipe } from '../../pipes/codigo-compra/codigo-compra';
import { Boton } from '../boton/boton';
import { BotonLink } from '../boton-link/boton-link';
import { AvisoEdad } from '../aviso-edad/aviso-edad';

@Component({
  imports: [AvisoEdad, Boton, BotonLink, CodigoCompraPipe],
  selector: 'app-confirmacion-compra',
  styleUrl: './confirmacion-compra.css',
  templateUrl: './confirmacion-compra.html',
})
export class ConfirmacionCompra {
  readonly restriccionEdad = input.required<number | null>();
  readonly qr = input.required<string | null>();
  readonly codigo = input.required<string | null>();
  readonly descuentoCupon = input.required<number>();
  readonly credito = input.required<number>();
  readonly mailEnviado = input.required<boolean | null>();
  readonly email = input.required<string>();

  protected descargarComprobante() {
    window.print();
  }
}
