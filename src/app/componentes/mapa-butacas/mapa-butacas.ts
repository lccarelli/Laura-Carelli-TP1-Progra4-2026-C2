import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { entradaVigente } from '../../utilidades/entrada';

type EstadoButaca = 'libre' | 'reservada' | 'vendida';

interface ButacaConEstado {
  butaca: Butaca;
  estado: EstadoButaca;
  seleccionada: boolean;
}

interface FilaDeButacas {
  fila: string;
  bloques: ButacaConEstado[][];
}

interface FilaDeResumen {
  etiqueta: string;
  normal: number;
  accesible: number;
  vip: number;
  total: number;
}

const ESTADOS: { estado: EstadoButaca; etiqueta: string }[] = [
  { estado: 'libre', etiqueta: 'Libre' },
  { estado: 'reservada', etiqueta: 'Reservada' },
  { estado: 'vendida', etiqueta: 'Vendida' },
];

function porNumero(a: ButacaConEstado, b: ButacaConEstado): number {
  return a.butaca.numero - b.butaca.numero;
}

@Component({
  imports: [],
  selector: 'app-mapa-butacas',
  styleUrl: './mapa-butacas.css',
  templateUrl: './mapa-butacas.html',
})
export class MapaButacas implements OnChanges {
  @Input() butacas: Butaca[] = [];
  @Input() entradas: Entrada[] = [];
  @Input() interactiva = false;
  @Input() seleccionadas: ReadonlySet<string> = new Set<string>();
  @Input() reservadasPropias: ReadonlySet<string> = new Set<string>();
  @Output() alternar = new EventEmitter<string>();

  protected filas = signal<FilaDeButacas[]>([]);
  protected resumen = signal<FilaDeResumen[]>([]);
  protected resumenTotal = signal<FilaDeResumen | null>(null);

  ngOnChanges() {
    const entradaPorButaca = new Map(
      this.entradas.filter(entradaVigente).map((entrada) => [entrada.butaca_id, entrada]),
    );
    const butacasPorFila = new Map<string, ButacaConEstado[]>();
    const conteo: Record<EstadoButaca, Record<Butaca['tipo'], number>> = {
      libre: { normal: 0, accesible: 0, vip: 0 },
      reservada: { normal: 0, accesible: 0, vip: 0 },
      vendida: { normal: 0, accesible: 0, vip: 0 },
    };

    for (const butaca of this.butacas) {
      const estadoReal: EstadoButaca = entradaPorButaca.get(butaca.id)?.estado ?? 'libre';
      const seleccionada = this.seleccionadas.has(butaca.id);
      let estado: EstadoButaca = estadoReal;

      if (estadoReal === 'reservada' && this.reservadasPropias.has(butaca.id)) {
        // la reserva es mía: si la deseleccioné, vuelve a estar libre para mí
        estado = 'libre';
      }

      const butacaConEstado: ButacaConEstado = { butaca, estado, seleccionada };
      const butacasDeFila = butacasPorFila.get(butaca.fila) ?? [];
      butacasDeFila.push(butacaConEstado);
      butacasPorFila.set(butaca.fila, butacasDeFila);
      conteo[estado][butaca.tipo]++;
    }

    this.filas.set(
      [...butacasPorFila.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fila, butacasDeFila]) => ({
          fila,
          bloques: [
            butacasDeFila.filter((b) => b.butaca.bloque === 'izquierdo').sort(porNumero),
            butacasDeFila.filter((b) => b.butaca.bloque === 'centro').sort(porNumero),
            butacasDeFila.filter((b) => b.butaca.bloque === 'derecho').sort(porNumero),
          ],
        })),
    );

    this.resumen.set(
      ESTADOS.map(({ estado, etiqueta }) => {
        const { normal, accesible, vip } = conteo[estado];
        return { etiqueta, normal, accesible, vip, total: normal + accesible + vip };
      }),
    );

    this.resumenTotal.set(
      this.resumen().reduce(
        (acumulado, fila) => ({
          etiqueta: 'Total',
          normal: acumulado.normal + fila.normal,
          accesible: acumulado.accesible + fila.accesible,
          vip: acumulado.vip + fila.vip,
          total: acumulado.total + fila.total,
        }),
        { etiqueta: 'Total', normal: 0, accesible: 0, vip: 0, total: 0 },
      ),
    );
  }

  protected clic(v: ButacaConEstado) {
    if (!this.interactiva) {
      return;
    }

    if (v.estado !== 'libre' && !v.seleccionada) {
      return;
    }

    this.alternar.emit(v.butaca.id);
  }
}
