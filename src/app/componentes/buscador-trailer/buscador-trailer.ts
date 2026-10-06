import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PeliculaServicio } from '../../servicios/pelicula/pelicula';
import { TrailerResultado } from '../../interfaces/trailer-resultado';
import { Boton } from '../boton/boton';
import { extraerIdYoutube, urlEmbedYoutube, urlVideoYoutube } from '../../utilidades/youtube';

@Component({
  imports: [Boton],
  selector: 'app-buscador-trailer',
  styleUrl: './buscador-trailer.css',
  templateUrl: './buscador-trailer.html',
})
export class BuscadorTrailer {
  private peliculaServicio = inject(PeliculaServicio);
  private sanitizer = inject(DomSanitizer);

  readonly consultaInicial = input('');
  readonly urlActual = input('');
  readonly elegido = output<string>();

  protected consulta = linkedSignal(() => this.consultaInicial());
  protected resultados = signal<TrailerResultado[]>([]);
  protected buscando = signal(false);
  protected mensaje = signal('');

  protected idActual = computed(() => extraerIdYoutube(this.urlActual()));

  protected vistaPrevia = computed(() => {
    const id = this.idActual();

    return id ? this.sanitizer.bypassSecurityTrustResourceUrl(urlEmbedYoutube(id)) : null;
  });

  async buscar() {
    const texto = this.consulta().trim();

    if (!texto || this.buscando()) return;

    this.buscando.set(true);
    this.mensaje.set('');

    const { data, error } = await this.peliculaServicio.buscarTrailer(texto);

    this.buscando.set(false);

    if (error) {
      this.resultados.set([]);
      this.mensaje.set(error.message);
      return;
    }

    const resultados = data?.resultados ?? [];
    this.resultados.set(resultados);
    this.mensaje.set(resultados.length ? '' : 'No se encontraron videos.');
  }

  elegir(resultado: TrailerResultado) {
    this.elegido.emit(urlVideoYoutube(resultado.id));
  }
}
