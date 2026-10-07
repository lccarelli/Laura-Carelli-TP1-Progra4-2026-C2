import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DatePipe, registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEsAr from '@angular/common/locales/es-AR';
import { Pelicula } from '../../../../interfaces/pelicula';
import { Errores } from '../../../../servicios/errores/errores';
import { FuncionServicio } from '../../../../servicios/funcion/funcion';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { FormularioFuncion } from './formulario';

registerLocaleData(localeEsAr);

const PELICULA = { id: 'p1', nombre: 'The Matrix', duracion_minutos: 136 } as Pelicula;

describe('FormularioFuncion', () => {
  let fixture: ComponentFixture<FormularioFuncion>;
  let crear: ReturnType<typeof vi.fn>;
  let crearRecurrente: ReturnType<typeof vi.fn>;
  let registrar: ReturnType<typeof vi.fn>;

  const html = () => fixture.nativeElement as HTMLElement;
  const campo = (control: string) =>
    html().querySelector<HTMLInputElement | HTMLSelectElement>(
      `[formControlName="${control}"], input[name="${control}"]`,
    )!;

  const escribir = (control: string, valor: string) => {
    const elemento = campo(control);
    elemento.value = valor;
    elemento.dispatchEvent(new Event(elemento.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  };

  const botonGuardar = () => html().querySelector<HTMLButtonElement>('button[type="submit"]')!;

  const enviar = async () => {
    html().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  const completarFuncionUnica = () => {
    escribir('pelicula_id', 'p1');
    escribir('inicio', '2026-10-20T20:00');
  };

  beforeEach(async () => {
    crear = vi.fn().mockResolvedValue({});
    crearRecurrente = vi.fn().mockResolvedValue({ resultados: [] });
    registrar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [FormularioFuncion],
      providers: [
        DatePipe,
        { provide: LOCALE_ID, useValue: 'es-AR' },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        { provide: FuncionServicio, useValue: { crear, crearRecurrente } },
        {
          provide: PeliculaServicio,
          useValue: { listar: () => Promise.resolve({ data: [PELICULA] }) },
        },
        { provide: Logger, useValue: { registrar } },
        { provide: Errores, useValue: { mostrar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioFuncion);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('precios por tipo de butaca', () => {
    it('muestra un campo por cada tipo de butaca', () => {
      expect(campo('precio_normal')).toBeTruthy();
      expect(campo('precio_accesible')).toBeTruthy();
      expect(campo('precio_vip')).toBeTruthy();
    });

    it('muestra cada precio con formato de moneda', () => {
      const formatos = Array.from(html().querySelectorAll('.campo__formato')).map((e) =>
        e.textContent?.replace(/\s+/g, ' ').trim(),
      );

      expect(formatos).toEqual(['$ 4.000', '$ 4.000', '$ 6.000']);
    });

    it('actualiza el formato mientras se escribe', () => {
      escribir('precio_vip', '12500');

      const formatos = html().querySelectorAll('.campo__formato');

      expect(formatos[2].textContent?.replace(/\s+/g, ' ').trim()).toBe('$ 12.500');
    });

    it('no muestra formato si el campo está vacío', () => {
      escribir('precio_normal', '');

      expect(html().querySelectorAll('.campo__formato')[0].textContent?.trim()).toBe('');
    });

    it('arranca con los precios por defecto', () => {
      expect(campo('precio_normal').value).toBe('4000');
      expect(campo('precio_accesible').value).toBe('4000');
      expect(campo('precio_vip').value).toBe('6000');
    });

    it('manda los precios por defecto si no se tocan', async () => {
      completarFuncionUnica();

      await enviar();

      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ precios: { normal: 4000, accesible: 4000, vip: 6000 } }),
      );
    });

    it('manda los precios que ingresó el administrador', async () => {
      completarFuncionUnica();
      escribir('precio_normal', '5000');
      escribir('precio_accesible', '3500');
      escribir('precio_vip', '9000');

      await enviar();

      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ precios: { normal: 5000, accesible: 3500, vip: 9000 } }),
      );
    });

    it('aplica los mismos precios a una serie de funciones', async () => {
      fixture.componentInstance.cambiarModo('recurrente');
      fixture.detectChanges();
      escribir('pelicula_id', 'p1');
      escribir('hora', '20:00');
      escribir('desde', '2026-10-20');
      escribir('hasta', '2026-10-27');
      fixture.componentInstance.alternarDia(2);
      escribir('precio_vip', '7500');

      await enviar();

      expect(crearRecurrente).toHaveBeenCalledWith(
        expect.objectContaining({ precios: { normal: 4000, accesible: 4000, vip: 7500 } }),
      );
    });

    it('deshabilita el botón con un precio en 0', () => {
      completarFuncionUnica();
      expect(botonGuardar().disabled).toBe(false);

      escribir('precio_vip', '0');

      expect(botonGuardar().disabled).toBe(true);
    });

    it('deshabilita el botón con un precio vacío', () => {
      completarFuncionUnica();

      escribir('precio_normal', '');

      expect(botonGuardar().disabled).toBe(true);
    });

    it('no guarda aunque se fuerce el envío con un precio inválido', async () => {
      completarFuncionUnica();
      escribir('precio_vip', '0');

      await enviar();

      expect(crear).not.toHaveBeenCalled();
    });

    it('deja los precios en el registro de actividad', async () => {
      completarFuncionUnica();
      escribir('precio_vip', '9000');

      await enviar();

      expect(registrar).toHaveBeenCalledWith(
        Flujo.AltaFuncion,
        TipoEvento.Exito,
        'The Matrix (normal $4000, accesible $4000, VIP $9000)',
      );
    });
  });
});
