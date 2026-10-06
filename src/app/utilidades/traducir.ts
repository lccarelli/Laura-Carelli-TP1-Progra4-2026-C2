interface TraductorNavegador {
  translate(texto: string): Promise<string>;
}

interface FabricaTraductor {
  create(opciones: { sourceLanguage: string; targetLanguage: string }): Promise<TraductorNavegador>;
}

const fabrica = (globalThis as unknown as { Translator?: FabricaTraductor }).Translator;

export const traduccionDisponible = !!fabrica;

export async function traducirAlEspanol(texto: string): Promise<string> {
  const traductor = await fabrica!.create({ sourceLanguage: 'en', targetLanguage: 'es' });
  return traductor.translate(texto);
}
