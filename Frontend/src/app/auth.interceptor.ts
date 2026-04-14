import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError } from 'rxjs';
import { environment } from '../environments/environment';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<any> => {
  //console.log(req);
  
  const httpClient = inject(HttpClient);
  const router = inject(Router);

  if (req.url.includes('/refresh-token') || req.url.includes('/login')) {
    return next(req);
  }

  const token = localStorage.getItem('token');
  let authReq = req;

  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      //console.log(error);
      if (error.status === 401 && token) {
        return handle401Error(req, next, httpClient, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  httpClient: HttpClient,
  router: Router
): Observable<any> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    logout(router);
    return throwError(() => new Error('No refresh token'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return httpClient.post<any>(`${environment.apiUrl}/Auth/refresh-token`, { refreshToken }).pipe(
      switchMap((tokenResponse: any) => {
        isRefreshing = false;
        
        const newToken = tokenResponse.token;
        const newRefreshToken = tokenResponse.refreshToken;

        if (newToken && newRefreshToken) {
          localStorage.setItem('token', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          refreshTokenSubject.next(newToken);

          //console.log('Tokens aggiornati con successo nell\'interceptor');

          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          }));
        } else {
          //console.error('Formato risposta refresh token non valido nell\'interceptor');
          throw new Error('Invalid refresh response format');
        }
      }),
      catchError((err) => {
        isRefreshing = false;
        //console.error('Errore durante refresh token nell\'interceptor:', err);
        logout(router);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(token => {
        return next(req.clone({
          setHeaders: { Authorization: `Bearer ${token!}` }
        }));
      })
    );
  }
}

function logout(router: Router) {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('refreshAttempts');
  router.navigate(['/login']);
}