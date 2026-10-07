import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { BotonLink } from '../boton-link/boton-link';

@Component({
  imports: [BotonLink],
  selector: 'app-acceso-compra',
  styleUrl: './acceso-compra.css',
  templateUrl: './acceso-compra.html',
})
export class AccesoCompra {
  protected router = inject(Router);

  readonly esCliente = input.required<boolean>();
  readonly emailCliente = input.required<string>();
  readonly restriccionEdad = input.required<number | null>();
  readonly edadClienteValida = input.required<boolean>();
  readonly emailAnonimo = input.required<string>();
  readonly edadAnonima = input.required<number | null>();
  readonly edadAnonimaValida = input.required<boolean>();

  readonly emailCambiado = output<string>();
  readonly edadCambiada = output<number | null>();

  protected cambiarEdad(texto: string) {
    const numero = Number(texto);
    this.edadCambiada.emit(texto.trim() !== '' && Number.isFinite(numero) ? numero : null);
  }
}
