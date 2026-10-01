import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { ReporteServicio } from '../../../servicios/reporte/reporte';
import { Errores } from '../../../servicios/errores/errores';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Boton } from '../../../componentes/boton/boton';
import { ReporteFacturacionDiaria } from '../../../interfaces/reporte-facturacion-diaria';
import {
  ReportePeliculaVistaMes,
  ReportePeliculaVistaSemana,
} from '../../../interfaces/reporte-pelicula-vista';
import { ReporteCandyVendido } from '../../../interfaces/reporte-candy-vendido';

type Periodo = 'semana' | 'mes';
type Tab = 'facturacion' | 'peliculas' | 'candy';

const COLOR_BARRAS = '#f2541a';
const COLORES_TORTA = [
  '#f2541a',
  '#131313',
  '#c1443a',
  '#4caf50',
  '#6c6c69',
  '#bebcb9',
  '#f2a61a',
  '#1a7cf2',
];

interface FilaMasVista {
  pelicula_nombre: string;
  entradas: number;
  periodoValor: string;
}

@Component({
  imports: [BotonLink, Boton, DatePipe, DecimalPipe],
  selector: 'app-reportes',
  styleUrl: './reportes.css',
  templateUrl: './reportes.html',
})
export class Reportes {
  private reporteServicio = inject(ReporteServicio);
  private errores = inject(Errores);

  protected facturacion = signal<ReporteFacturacionDiaria[]>([]);
  protected masVistasSemana = signal<ReportePeliculaVistaSemana[]>([]);
  protected masVistasMes = signal<ReportePeliculaVistaMes[]>([]);
  protected candy = signal<ReporteCandyVendido[]>([]);
  protected periodo = signal<Periodo>('semana');
  protected tabActiva = signal<Tab>('facturacion');

  private canvasBarras = viewChild<ElementRef<HTMLCanvasElement>>('canvasBarras');
  private canvasTorta = viewChild<ElementRef<HTMLCanvasElement>>('canvasTorta');
  private canvasCandy = viewChild<ElementRef<HTMLCanvasElement>>('canvasCandy');
  private chartBarras: Chart | null = null;
  private chartTorta: Chart | null = null;
  private chartCandy: Chart | null = null;

  protected totalFacturado = computed(() =>
    this.facturacion().reduce((acumulado, fila) => acumulado + fila.total_facturado, 0),
  );

  protected totalEntradas = computed(() =>
    this.facturacion().reduce((acumulado, fila) => acumulado + fila.entradas_vendidas, 0),
  );

  protected masVistas = computed<FilaMasVista[]>(() =>
    this.periodo() === 'semana'
      ? this.masVistasSemana().map((fila) => ({
          pelicula_nombre: fila.pelicula_nombre,
          entradas: fila.entradas,
          periodoValor: fila.semana,
        }))
      : this.masVistasMes().map((fila) => ({
          pelicula_nombre: fila.pelicula_nombre,
          entradas: fila.entradas,
          periodoValor: fila.mes,
        })),
  );

  // Sólo el período más reciente (la última semana o el último mes con
  // datos) — si se mezclara todo el historial junto no se entendería.
  protected masVistasUltimoPeriodo = computed(() => {
    const filas = this.masVistas();

    if (filas.length === 0) {
      return [];
    }

    const ultimoPeriodo = filas.reduce(
      (max, fila) => (fila.periodoValor > max ? fila.periodoValor : max),
      filas[0].periodoValor,
    );

    return filas
      .filter((fila) => fila.periodoValor === ultimoPeriodo)
      .sort((a, b) => b.entradas - a.entradas);
  });

  constructor() {
    this.cargar();

    effect(() => {
      if (this.tabActiva() !== 'peliculas') {
        this.chartBarras?.destroy();
        this.chartBarras = null;
        this.chartTorta?.destroy();
        this.chartTorta = null;
        return;
      }

      this.dibujarBarras(this.masVistasUltimoPeriodo());
      this.dibujarTorta(this.masVistasUltimoPeriodo());
    });

    effect(() => {
      if (this.tabActiva() !== 'candy') {
        this.chartCandy?.destroy();
        this.chartCandy = null;
        return;
      }

      this.dibujarCandy(this.candy());
    });
  }

  async cargar() {
    const [
      { data: facturacion, error: errorFacturacion },
      { data: semana, error: errorSemana },
      { data: mes, error: errorMes },
      { data: candy, error: errorCandy },
    ] = await Promise.all([
      this.reporteServicio.facturacionDiaria(),
      this.reporteServicio.peliculasMasVistasPorSemana(),
      this.reporteServicio.peliculasMasVistasPorMes(),
      this.reporteServicio.candyMasVendido(),
    ]);

    const error = errorFacturacion ?? errorSemana ?? errorMes ?? errorCandy;

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    this.facturacion.set(facturacion ?? []);
    this.masVistasSemana.set(semana ?? []);
    this.masVistasMes.set(mes ?? []);
    this.candy.set(candy ?? []);
  }

  cambiarTab(tab: Tab) {
    this.tabActiva.set(tab);
  }

  cambiarPeriodo(periodo: Periodo) {
    this.periodo.set(periodo);
  }

  private dibujarBarras(filas: FilaMasVista[]) {
    const canvas = this.canvasBarras()?.nativeElement;

    this.chartBarras?.destroy();
    this.chartBarras = null;

    if (!canvas || filas.length === 0) {
      return;
    }

    const top = filas.slice(0, 8);

    this.chartBarras = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map((fila) => fila.pelicula_nombre),
        datasets: [
          {
            label: 'Entradas vendidas',
            data: top.map((fila) => fila.entradas),
            backgroundColor: COLOR_BARRAS,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  private dibujarTorta(filas: FilaMasVista[]) {
    const canvas = this.canvasTorta()?.nativeElement;

    this.chartTorta?.destroy();
    this.chartTorta = null;

    if (!canvas || filas.length === 0) {
      return;
    }

    // Top 6 con nombre propio + el resto agrupado en "Otras", para que
    // los porcentajes sean sobre el total real y no sólo sobre el top.
    const top = filas.slice(0, 6);
    const resto = filas.slice(6).reduce((acumulado, fila) => acumulado + fila.entradas, 0);

    const etiquetas = top.map((fila) => fila.pelicula_nombre);
    const valores = top.map((fila) => fila.entradas);

    if (resto > 0) {
      etiquetas.push('Otras');
      valores.push(resto);
    }

    this.chartTorta = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: etiquetas,
        datasets: [{ data: valores, backgroundColor: COLORES_TORTA }],
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private dibujarCandy(filas: ReporteCandyVendido[]) {
    const canvas = this.canvasCandy()?.nativeElement;

    this.chartCandy?.destroy();
    this.chartCandy = null;

    if (!canvas || filas.length === 0) {
      return;
    }

    const top = filas.slice(0, 8);

    this.chartCandy = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map((fila) => fila.producto_nombre),
        datasets: [
          {
            label: 'Unidades vendidas',
            data: top.map((fila) => fila.cantidad_vendida),
            backgroundColor: COLOR_BARRAS,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  exportarExcel() {
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(this.facturacion()),
      'Facturación diaria',
    );
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(this.masVistas()),
      this.periodo() === 'semana' ? 'Más vistas por semana' : 'Más vistas por mes',
    );
    XLSX.utils.book_append_sheet(
      libro,
      XLSX.utils.json_to_sheet(this.candy()),
      'Candy más vendido',
    );

    XLSX.writeFile(libro, `reportes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportarPdf() {
    window.print();
  }
}
