interface PeliculaConPreventa {
  fecha_estreno: string | null;
  dias_preventa: number | null;
  porcentaje_preventa: number | null;
}

export function estaEnPreventa(pelicula: PeliculaConPreventa): boolean {
  if (
    !pelicula.fecha_estreno ||
    pelicula.dias_preventa === null ||
    pelicula.porcentaje_preventa === null
  ) {
    return false;
  }

  const estreno = new Date(`${pelicula.fecha_estreno}T00:00:00`);
  const inicioPreventa = new Date(estreno);
  inicioPreventa.setDate(inicioPreventa.getDate() - pelicula.dias_preventa);

  const hoy = new Date();
  return hoy >= inicioPreventa && hoy < estreno;
}
