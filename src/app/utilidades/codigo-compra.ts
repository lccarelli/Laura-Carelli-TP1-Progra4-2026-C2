const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LONGITUD = 8;
const LONGITUD_GRUPO = 4;
// Descarta los bytes que sobran para que todos los caracteres salgan con la misma probabilidad
const LIMITE_SIN_SESGO = 256 - (256 % ALFABETO.length);
// Las compras anteriores al código corto usan un UUID
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generarCodigoCompra(): string {
  let codigo = '';

  while (codigo.length < LONGITUD) {
    for (const byte of crypto.getRandomValues(new Uint8Array(LONGITUD))) {
      if (byte < LIMITE_SIN_SESGO && codigo.length < LONGITUD) {
        codigo += ALFABETO[byte % ALFABETO.length];
      }
    }
  }

  return codigo;
}

export function normalizarCodigo(texto: string): string {
  const limpio = texto.trim();

  return FORMATO_UUID.test(limpio)
    ? limpio.toLowerCase()
    : limpio.replace(/[\s-]/g, '').toUpperCase();
}

export function formatearCodigo(codigo: string): string {
  if (codigo.length !== LONGITUD) {
    return codigo;
  }

  return `${codigo.slice(0, LONGITUD_GRUPO)}-${codigo.slice(LONGITUD_GRUPO)}`;
}
