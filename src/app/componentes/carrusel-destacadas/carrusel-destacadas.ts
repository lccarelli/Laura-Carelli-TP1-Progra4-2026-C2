import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Poster } from '../poster/poster';
import { Cargando } from '../cargando/cargando';
import { EstrellasPipe } from '../../pipes/estrellas/estrellas';
import { RestriccionEdadPipe } from '../../pipes/restriccion-edad/restriccion-edad';
import { DestacadaVista } from './destacada-vista';
import { extraerIdYoutube, urlEmbedYoutube } from '../../utilidades/youtube';

@Component({
  imports: [RouterLink, Poster, Cargando, EstrellasPipe, RestriccionEdadPipe],
  selector: 'app-carrusel-destacadas',
  styleUrl: './carrusel-destacadas.css',
  templateUrl: './carrusel-destacadas.html',
})
export class CarruselDestacadas {
  readonly items = input<DestacadaVista[]>([]);

  private sanitizer = inject(DomSanitizer);
  private peliculaActivaId = signal<string | null>(null);
  protected trailersCargados = signal<ReadonlySet<string>>(new Set());

  protected indiceActual = computed(() => {
    const indice = this.items().findIndex((item) => item.pelicula.id === this.peliculaActivaId());

    return indice === -1 ? 0 : indice;
  });

  protected trailersEmbebidos = computed<(SafeResourceUrl | null)[]>(() =>
    this.items().map((item) => {
      const trailerUrl = item.pelicula.trailer_url;
      const idYoutube = trailerUrl ? extraerIdYoutube(trailerUrl) : null;

      return idYoutube
        ? this.sanitizer.bypassSecurityTrustResourceUrl(
            `${urlEmbedYoutube(idYoutube)}?autoplay=1&mute=1`,
          )
        : null;
    }),
  );

  protected trailerCargo(peliculaId: string) {
    this.trailersCargados.update((actuales) => new Set(actuales).add(peliculaId));
  }

  protected irA(indice: number) {
    this.peliculaActivaId.set(this.items()[indice]?.pelicula.id ?? null);
  }
}
