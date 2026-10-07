export function calcularEdad(fechaNacimiento: string, fechaReferencia: Date): number {
  const nacimiento = new Date(fechaNacimiento);
  let edad = fechaReferencia.getFullYear() - nacimiento.getFullYear();
  const noCumplioTodavia =
    fechaReferencia.getMonth() < nacimiento.getMonth() ||
    (fechaReferencia.getMonth() === nacimiento.getMonth() &&
      fechaReferencia.getDate() < nacimiento.getDate());

  if (noCumplioTodavia) {
    edad--;
  }

  return edad;
}

export function cumpleEdadMinima(edad: number | null, edadMinima: number | null): boolean {
  if (!edadMinima) {
    return true;
  }

  return edad !== null && edad >= edadMinima;
}
