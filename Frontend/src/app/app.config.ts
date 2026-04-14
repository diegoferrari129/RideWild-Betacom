
import { ApplicationConfig, importProvidersFrom, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth.interceptor';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { GlobalErrorHandler } from './global-error-handler';
import { DatePipe } from '@angular/common';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        AuthInterceptor,
        HttpErrorInterceptor
      ])
    ),

    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    DatePipe,

    // LoggerModule.forRoot() restituisce un NgModule
    importProvidersFrom(
      LoggerModule.forRoot({
        // log in console
        level: NgxLoggerLevel.DEBUG,
        // log inviati a serilog
        serverLogLevel: NgxLoggerLevel.ERROR,
        serverLoggingUrl: `${environment.apiUrl}/NgxLogger`,
        timestampFormat: 'short',
        disableConsoleLogging: false,
      })
    ),
  ]
};

