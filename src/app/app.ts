import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MensajeError } from './componentes/mensaje-error/mensaje-error';
import { Header } from './componentes/header/header';

@Component({
  imports: [RouterOutlet, MensajeError, Header],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
