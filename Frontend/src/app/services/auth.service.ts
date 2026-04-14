import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, throwError, catchError, Observable, BehaviorSubject } from 'rxjs';
import { Register } from '../models/register';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CustomersService } from './customers.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;
  private customerService = inject(CustomersService);
  private jwtHelper = new JwtHelperService();

  public isLoggedCustomer = false;
  public isLoggedAdmin = false;

  private loginStateSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public loginState$ = this.loginStateSubject.asObservable();

  constructor() {
    this.checkInitialTokenState();
  }

  private checkInitialTokenState() {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && refreshToken) {
      const decoded = this.jwtHelper.decodeToken(token);
      if (!this.jwtHelper.isTokenExpired(token)) {
        if (decoded && decoded.role === 'Admin') {
          //console.log("Admin entrato");
          this.isLoggedAdmin = true;
        } else {
          //console.log("Customer entrato");
          this.isLoggedCustomer = true;
        }
        this.loginStateSubject.next(true);
      } else {
        this.attemptTokenRefresh();
      }
    }
  }

  private attemptTokenRefresh() {
    this.refreshToken().subscribe({
      next: () => {
        this.isLoggedCustomer = true;
        this.loginStateSubject.next(true);
        //console.log('Token refreshed on startup');
      },
      error: () => {
        this.logout();
      }
    });
  }

  login(auth: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, auth).pipe(
      tap((response: any) => {
        //console.log('Login response:', response);
        const token = response.token;
        if (token) {
          const decoded = this.jwtHelper.decodeToken(token);
          if (decoded && decoded.role === 'Admin') {
            //console.log("Admin entrato");
            this.isLoggedAdmin = true;
          } else {
            //console.log("Customer entrato");
            this.isLoggedCustomer = true;
          }

          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.removeItem('refreshAttempts');

          this.loginStateSubject.next(true);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        //console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshAttempts');

    this.isLoggedCustomer = false;
    this.isLoggedAdmin = false;
    this.loginStateSubject.next(false);

    this.customerService.clearState();
    this.router.navigate(['/login']);
  }

  register(data: Register): Observable<any> {
    //console.log('Registration data:', data);
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    //console.log('AuthService.refreshToken() chiamato. Refresh token:', refreshToken);

    if (!refreshToken) {
      //console.warn('Nessun refresh token presente in AuthService.refreshToken()');
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap((response: any) => {
        //console.log('Risposta da backend RefreshToken:', response);
        if (response.token && response.refreshToken) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.isLoggedCustomer = true;
          this.loginStateSubject.next(true);
          //console.log('Tokens aggiornati con successo nel service');
        } else {
          //console.error('Formato risposta refresh token non valido');
          throw new Error('Invalid refresh response format');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        //console.error('Errore durante refresh token:', error);
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  isAdminLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      return false;
    }

    try {
      const decoded = this.jwtHelper.decodeToken(token);
      return decoded.role === "Admin";
    } catch (error) {
      //console.error('Token decode error:', error);
      return false;
    }
  }

  recoverPsw(inputValue: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recovery-password-request`, JSON.stringify(inputValue), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updatePassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recovery-password`, { token, newPassword });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }
}
