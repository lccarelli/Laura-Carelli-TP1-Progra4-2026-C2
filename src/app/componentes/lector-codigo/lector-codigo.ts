import { Component, OnDestroy, inject, input, output, signal } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { Errores } from '../../servicios/errores/errores';
import { normalizarCodigo } from '../../utilidades/codigo-compra';
import { Boton } from '../boton/boton';

const ID_LECTOR = 'lector-qr';

@Component({
  imports: [Boton],
  selector: 'app-lector-codigo',
  styleUrl: './lector-codigo.css',
  templateUrl: './lector-codigo.html',
})
export class LectorCodigo implements OnDestroy {
  private errores = inject(Errores);

  readonly buscando = input(false);
  readonly buscar = output<string>();

  protected readonly idLector = ID_LECTOR;
  protected codigo = signal('');
  protected escaneando = signal(false);

  private lector: Html5Qrcode | null = null;

  emitirCodigo() {
    const codigo = normalizarCodigo(this.codigo());

    if (codigo) {
      this.buscar.emit(codigo);
    }
  }

  async alternarEscaner() {
    if (this.escaneando()) {
      await this.detenerEscaner();
      return;
    }

    this.escaneando.set(true);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    this.lector = new Html5Qrcode(ID_LECTOR);

    try {
      await this.lector.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (textoDecodificado) => {
          this.codigo.set(textoDecodificado);
          await this.detenerEscaner();
          this.emitirCodigo();
        },
        undefined,
      );
    } catch {
      this.errores.mostrar('No se pudo acceder a la cámara.');
      this.escaneando.set(false);
    }
  }

  private async detenerEscaner() {
    if (this.lector?.isScanning) {
      await this.lector.stop();
    }

    this.lector = null;
    this.escaneando.set(false);
  }

  ngOnDestroy() {
    if (this.lector?.isScanning) {
      this.lector.stop();
    }
  }
}
