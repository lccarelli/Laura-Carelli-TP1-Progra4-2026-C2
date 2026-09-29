import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MensajeError } from './componentes/mensaje-error/mensaje-error';
import { Header } from './componentes/header/header';
import { ActualizacionDisponible } from './componentes/actualizacion-disponible/actualizacion-disponible';
import { AvisoCuponBienvenida } from './componentes/aviso-cupon-bienvenida/aviso-cupon-bienvenida';

@Component({
  imports: [RouterOutlet, MensajeError, Header, ActualizacionDisponible, AvisoCuponBienvenida],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
