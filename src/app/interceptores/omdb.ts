import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

export const omdbInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.OMDB_URL)) {
    return next(req);
  }

  const conClave = req.clone({ setParams: { apikey: environment.OMDB_KEY } });

  return next(conClave).pipe(
    map((evento) => {
      if (evento instanceof HttpResponse) {
        const cuerpo = evento.body as { Response?: string; Error?: string } | null;

        if (cuerpo?.Response === 'False') {
          throw new Error(cuerpo.Error ?? 'Error de OMDb');
        }
      }

      return evento;
    }),
  );
};
