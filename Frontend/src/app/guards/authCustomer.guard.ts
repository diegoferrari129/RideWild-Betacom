import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthGuardCustomer implements CanActivate {

  selectedTab: 'login' | 'register' = 'login';

  constructor(private authService: AuthService, private route: Router, private router: ActivatedRoute ) {}

  ngOnInit() {
    this.router.queryParams.subscribe(params => {
      const tipo = params['tipo'];
      if (tipo === 'login') {
        this.selectedTab = 'login';
      } else {
        this.selectedTab = 'register';
      }
    });
  }
  canActivate(): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      return this.route.createUrlTree(['/login'], { queryParams: { tipo: 'login' } });
    }
  }
}
