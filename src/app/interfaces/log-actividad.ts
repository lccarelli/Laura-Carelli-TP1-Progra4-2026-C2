export interface LogActividad {
  id: string;
  flujo: string;
  evento: string;
  entidad_afectada: string | null;
  usuario_email: string | null;
  creada_en: string;
}
