
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import Swal from 'sweetalert2';

export const HttpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const logger = inject(NGXLogger);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      let errorMessage = 'Errore non gestito';
      let errorContext: any = {
        url: req.url,
        method: req.method,
        statusCode: error.status,
        statusText: error.statusText,
      };

      if (error.error instanceof ErrorEvent) {
        // Client-side
        errorMessage = `Errore client: ${error.error.message}`;
        errorContext.clientErrorDetails = error.error;
      } else {
        // Server-side
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          // parso il model state
          errorMessage = Object.entries(error.error.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join(' | ');
        } else {
          errorMessage = error.message || `Errore server: ${error.status}`;
        }

        errorContext.responseBody = error.error;
        errorContext.headers = error.headers.keys().reduce((acc: Record<string, string | null>, key) => {
           acc[key] = error.headers.get(key);
          return acc;
       }, {});
      }

      logger.error(errorMessage, errorContext);

      if (error.status !== 401) {
        Swal.fire({
          icon: 'error',
          title: 'ERRORE',
          text: errorMessage,
          width: '300px',
          padding: '1em',
          background: '#fff',
          color: '#333',
          confirmButtonColor: '#d33',
          timer: 4000,
          showConfirmButton: false
        })
      }
      
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
      }));
    })
  );
};
