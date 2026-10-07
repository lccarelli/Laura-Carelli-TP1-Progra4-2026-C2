import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const omdbInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.OMDB_URL)) {
    return next(req);
  }

  const request = req.clone({
    params: req.params.set('apikey', environment.OMDB_KEY),
  });

  return next(request);
};
