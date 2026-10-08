export function avisoDeConservadas(conservadas: number): string | null {
  if (conservadas === 0) {
    return null;
  }

  return conservadas === 1
    ? 'Una función no se eliminó porque tiene compras registradas. Desactivala para que deje de mostrarse.'
    : `${conservadas} funciones no se eliminaron porque tienen compras registradas. Desactivalas para que dejen de mostrarse.`;
}

export function descripcionDeBaja(eliminadas: number): string {
  return eliminadas === 1 ? '1 función' : `${eliminadas} funciones`;
}
