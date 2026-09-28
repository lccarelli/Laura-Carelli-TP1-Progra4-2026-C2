import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MensajeError } from './componentes/mensaje-error/mensaje-error';
import { Header } from './componentes/header/header';
import { ActualizacionDisponible } from './componentes/actualizacion-disponible/actualizacion-disponible';

@Component({
  imports: [RouterOutlet, MensajeError, Header, ActualizacionDisponible],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
