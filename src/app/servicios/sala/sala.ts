import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Sala } from '../../interfaces/sala';
import { SalaPorCrear } from '../../interfaces/sala-por-crear';
import { Butaca } from '../../interfaces/butaca';

const FILAS_NORMALES = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
];
const FILAS_VIP = ['R', 'S', 'T'];
const FILA_ACCESIBLE = 'J';

@Service()
export class SalaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'sala';

  listar() {
    return this.supabase.listar<Sala>(this.tabla);
  }

  async crear(sala: SalaPorCrear) {
    const { data, error } = await this.supabase.Supabase.from(this.tabla)
      .insert(sala)
      .select()
      .returns<Sala[]>();

    if (error || !data) {
      return { error };
    }

    const butacas = this.generarButacas(data[0].id);
    return this.supabase.Supabase.from('butaca').insert(butacas);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  private generarButacas(salaId: string): Omit<Butaca, 'id'>[] {
    const butacas: Omit<Butaca, 'id'>[] = [];

    const agregarFila = (fila: string, tipo: Butaca['tipo'], tamanos: [number, number, number]) => {
      const bloques: { nombre: Butaca['bloque']; cantidad: number }[] = [
        { nombre: 'izquierda', cantidad: tamanos[0] },
        { nombre: 'centro', cantidad: tamanos[1] },
        { nombre: 'derecha', cantidad: tamanos[2] },
      ];

      let numero = 1;
      for (const bloque of bloques) {
        for (let i = 0; i < bloque.cantidad; i++) {
          butacas.push({
            sala_id: salaId,
            fila,
            numero: numero++,
            bloque: bloque.nombre,
            tipo,
          });
        }
      }
    };

    for (const fila of FILAS_NORMALES) {
      agregarFila(fila, 'normal', [4, 20, 4]);
    }

    agregarFila(FILA_ACCESIBLE, 'accesible', [2, 10, 2]);

    for (const fila of FILAS_VIP) {
      agregarFila(fila, 'vip', [4, 20, 4]);
    }

    return butacas;
  }
}
