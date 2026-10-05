import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
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
export class CarruselDestacadas implements OnChanges {
  @Input() items: DestacadaVista[] = [];

  private sanitizer = inject(DomSanitizer);
  protected indiceActual = signal(0);
  protected trailersEmbebidos = signal<(SafeResourceUrl | null)[]>([]);
  protected trailersCargados = signal<Set<number>>(new Set());

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['items']) {
      return;
    }

    this.indiceActual.set(0);
    this.trailersCargados.set(new Set());
    this.trailersEmbebidos.set(
      this.items.map((item) => {
        const trailerUrl = item.pelicula.trailer_url;
        const idYoutube = trailerUrl ? extraerIdYoutube(trailerUrl) : null;

        return idYoutube
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
              `${urlEmbedYoutube(idYoutube)}?autoplay=1&mute=1`,
            )
          : null;
      }),
    );
  }

  trailerCargo(indice: number) {
    this.trailersCargados.update((actuales) => new Set(actuales).add(indice));
  }

  irA(indice: number) {
    this.indiceActual.set(indice);
  }
}
