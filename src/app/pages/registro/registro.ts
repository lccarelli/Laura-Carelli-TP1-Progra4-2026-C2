import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../servicios/auth/auth';
import { Errores } from '../../servicios/errores/errores';
import { Boton } from '../../componentes/boton/boton';
import { BotonLink } from '../../componentes/boton-link/boton-link';
import { Logger } from '../../servicios/logger/logger';
import { Flujo } from '../../servicios/logger/flujo';
import { TipoEvento } from '../../servicios/logger/tipo-evento';

const SOLO_LETRAS = /^[A-Za-zÀ-ÿ\s]+$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDAD_MAXIMA = 120;
const PASSWORD_LONGITUD_MINIMA = 8;

type RequisitoPassword = 'longitud' | 'mayuscula' | 'minuscula' | 'numero' | 'simbolo';

const REQUISITOS_PASSWORD: {
  clave: RequisitoPassword;
  etiqueta: string;
  cumple: (valor: string) => boolean;
}[] = [
  {
    clave: 'longitud',
    etiqueta: `Al menos ${PASSWORD_LONGITUD_MINIMA} caracteres`,
    cumple: (valor) => valor.length >= PASSWORD_LONGITUD_MINIMA,
  },
  { clave: 'mayuscula', etiqueta: 'Una mayúscula', cumple: (valor) => /[A-Z]/.test(valor) },
  { clave: 'minuscula', etiqueta: 'Una minúscula', cumple: (valor) => /[a-z]/.test(valor) },
  { clave: 'numero', etiqueta: 'Un número', cumple: (valor) => /[0-9]/.test(valor) },
  {
    clave: 'simbolo',
    etiqueta: 'Un símbolo (!@#$...)',
    cumple: (valor) => /[^A-Za-z0-9]/.test(valor),
  },
];

function fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const fecha = new Date(control.value);
  const hoy = new Date();

  if (fecha > hoy) {
    return { fechaFutura: true };
  }

  const edad = hoy.getFullYear() - fecha.getFullYear();

  return edad > EDAD_MAXIMA ? { edadInvalida: true } : null;
}

function passwordSeguraValidator(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  const errores: ValidationErrors = {};

  for (const requisito of REQUISITOS_PASSWORD) {
    if (!requisito.cumple(valor)) {
      errores[requisito.clave] = true;
    }
  }

  return Object.keys(errores).length > 0 ? errores : null;
}

function passwordsCoincidenValidator(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmarPassword = grupo.get('confirmarPassword')?.value;

  return password === confirmarPassword ? null : { passwordsNoCoinciden: true };
}

@Component({
  imports: [ReactiveFormsModule, Boton, BotonLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private auth = inject(Auth);
  private errores = inject(Errores);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private logger = inject(Logger);

  protected registrado = signal(false);
  protected mostrarPassword = signal(false);
  protected tiposDeSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  protected coloresDeOjos = ['Marrón', 'Negro', 'Verde', 'Azul', 'Gris', 'Miel'];
  protected requisitosPassword = REQUISITOS_PASSWORD;
  protected hoy = new Date().toISOString().split('T')[0];

  protected formulario = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.pattern(EMAIL_VALIDO)]],
      password: ['', [Validators.required, passwordSeguraValidator]],
      confirmarPassword: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
      apellido: ['', [Validators.required, Validators.pattern(SOLO_LETRAS)]],
      fecha_nacimiento: ['', [Validators.required, fechaNacimientoValidator]],
      tipo_sangre: ['', Validators.required],
      color_ojos: ['', Validators.required],
      dias_vacaciones: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    },
    { validators: passwordsCoincidenValidator },
  );

  alternarMostrarPassword() {
    this.mostrarPassword.update((valor) => !valor);
  }

  cumpleRequisito(clave: RequisitoPassword): boolean {
    const valor: string = this.formulario.get('password')?.value ?? '';
    return REQUISITOS_PASSWORD.find((r) => r.clave === clave)?.cumple(valor) ?? false;
  }

  mensajeDeError(campo: string): string | null {
    const control = this.formulario.get(campo);

    if (!control || !control.touched) {
      return null;
    }

    if (campo === 'confirmarPassword' && this.formulario.errors?.['passwordsNoCoinciden']) {
      return 'Las contraseñas no coinciden.';
    }

    if (!control.errors) {
      return null;
    }

    const errores = control.errors;

    if (errores['required']) return 'Este campo es obligatorio.';
    if (errores['pattern']) {
      return campo === 'email'
        ? 'El email no tiene un formato válido.'
        : 'Sólo se permiten letras.';
    }
    if (errores['fechaFutura']) return 'La fecha no puede ser futura.';
    if (errores['edadInvalida']) return 'Revisá la fecha, la edad no parece correcta.';
    if (errores['min']) return `El mínimo es ${errores['min'].min}.`;
    if (errores['max']) return `El máximo es ${errores['max'].max}.`;

    return null;
  }

  async enviar() {
    const {
      email,
      password,
      nombre,
      apellido,
      fecha_nacimiento,
      tipo_sangre,
      color_ojos,
      dias_vacaciones,
    } = this.formulario.getRawValue();

    const { data, error } = await this.auth.registrarCliente({
      email,
      password,
      nombre,
      apellido,
      fecha_nacimiento,
      tipo_sangre,
      color_ojos,
      dias_vacaciones,
    });

    if (error) {
      this.logger.registrar(Flujo.AltaUsuario, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaUsuario, TipoEvento.Exito, email);

    if (data.session) {
      await this.router.navigate(['/peliculas']);
    } else {
      this.registrado.set(true);
    }
  }
}
