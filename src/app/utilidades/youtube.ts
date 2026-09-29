const PATRONES_YOUTUBE = [
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/watch\?v=([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

export function extraerIdYoutube(url: string): string | null {
  for (const patron of PATRONES_YOUTUBE) {
    const coincidencia = url.match(patron);
    if (coincidencia) {
      return coincidencia[1];
    }
  }

  return null;
}
