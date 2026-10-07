import { ItemCandy } from '../servicios/compra-candy/compra-candy';
import { ItemCombo } from '../servicios/compra-combo/compra-combo';

export interface CompraPorConfirmar {
  codigo: string;
  funcionId: string;
  butacaIds: string[];
  sesionId: string;
  email: string;
  edadDeclarada: number | null;
  total: number;
  descuentoCupon: number;
  premioId: string | null;
  credito: number;
  candy: ItemCandy[];
  combos: ItemCombo[];
}
