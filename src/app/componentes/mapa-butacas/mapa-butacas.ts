import { Component, computed, input, output } from '@angular/core';
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
export class MapaButacas {
  readonly butacas = input<Butaca[]>([]);
  readonly entradas = input<Entrada[]>([]);
  readonly interactiva = input(false);
  readonly seleccionadas = input<ReadonlySet<string>>(new Set<string>());
  readonly reservadasPropias = input<ReadonlySet<string>>(new Set<string>());
  readonly alternar = output<string>();

  private vistas = computed<ButacaConEstado[]>(() => {
    const entradaPorButaca = new Map(
      this.entradas()
        .filter(entradaVigente)
        .map((entrada) => [entrada.butaca_id, entrada]),
    );

    return this.butacas().map((butaca) => {
      const estadoReal: EstadoButaca = entradaPorButaca.get(butaca.id)?.estado ?? 'libre';
      // la reserva es mía: si la deseleccioné, vuelve a estar libre para mí
      const esMia = estadoReal === 'reservada' && this.reservadasPropias().has(butaca.id);

      return {
        butaca,
        estado: esMia ? 'libre' : estadoReal,
        seleccionada: this.seleccionadas().has(butaca.id),
      };
    });
  });

  protected filas = computed<FilaDeButacas[]>(() => {
    const butacasPorFila = new Map<string, ButacaConEstado[]>();

    for (const vista of this.vistas()) {
      const deLaFila = butacasPorFila.get(vista.butaca.fila) ?? [];
      deLaFila.push(vista);
      butacasPorFila.set(vista.butaca.fila, deLaFila);
    }

    return [...butacasPorFila.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fila, deLaFila]) => ({
        fila,
        bloques: [
          deLaFila.filter((v) => v.butaca.bloque === 'izquierdo').sort(porNumero),
          deLaFila.filter((v) => v.butaca.bloque === 'centro').sort(porNumero),
          deLaFila.filter((v) => v.butaca.bloque === 'derecho').sort(porNumero),
        ],
      }));
  });

  protected resumen = computed<FilaDeResumen[]>(() =>
    ESTADOS.map(({ estado, etiqueta }) => {
      const delEstado = this.vistas().filter((v) => v.estado === estado);
      const contar = (tipo: Butaca['tipo']) =>
        delEstado.filter((v) => v.butaca.tipo === tipo).length;
      const [normal, accesible, vip] = [contar('normal'), contar('accesible'), contar('vip')];

      return { etiqueta, normal, accesible, vip, total: normal + accesible + vip };
    }),
  );

  protected resumenTotal = computed<FilaDeResumen>(() =>
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

  protected clic(v: ButacaConEstado) {
    if (!this.interactiva()) {
      return;
    }

    if (v.estado !== 'libre' && !v.seleccionada) {
      return;
    }

    this.alternar.emit(v.butaca.id);
  }
}
