import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PeliculaServicio } from '../../servicios/pelicula/pelicula';
import { TrailerResultado } from '../../interfaces/trailer-resultado';
import { Boton } from '../boton/boton';
import { extraerIdYoutube } from '../../utilidades/youtube';

@Component({
  imports: [ReactiveFormsModule, Boton],
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

  protected consulta = new FormControl('', { nonNullable: true });
  protected resultados = signal<TrailerResultado[]>([]);
  protected buscando = signal(false);
  protected buscado = signal(false);
  protected error = signal<string | null>(null);

  protected idActual = computed(() => extraerIdYoutube(this.urlActual()));

  protected vistaPrevia = computed<SafeResourceUrl | null>(() => {
    const id = this.idActual();

    return id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`)
      : null;
  });

  constructor() {
    effect(() => {
      if (!this.consulta.dirty) {
        this.consulta.setValue(this.consultaInicial());
      }
    });
  }

  async buscar() {
    const texto = this.consulta.value.trim();

    if (!texto || this.buscando()) return;

    this.buscando.set(true);
    this.error.set(null);

    const { data, error } = await this.peliculaServicio.buscarTrailer(texto);

    this.buscando.set(false);
    this.buscado.set(true);

    if (error) {
      this.resultados.set([]);
      this.error.set(error.message);
      return;
    }

    this.resultados.set(data?.resultados ?? []);
  }

  elegir(resultado: TrailerResultado) {
    this.elegido.emit(`https://www.youtube.com/watch?v=${resultado.id}`);
  }
}
