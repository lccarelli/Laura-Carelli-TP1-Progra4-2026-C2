import { environment } from '../../environments/environment';

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

export function urlEmbedYoutube(id: string): string {
  return `${environment.YOUTUBE_EMBED_URL}${id}`;
}

export function urlVideoYoutube(id: string): string {
  return `${environment.YOUTUBE_WATCH_URL}${id}`;
}
