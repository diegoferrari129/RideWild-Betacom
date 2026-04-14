import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Auth } from '../../models/auth';
import { Register } from '../../models/register';
import { JwtHelperService } from '@auth0/angular-jwt';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  selectedTab: 'login' | 'register' = 'login';

  showLoginPassword = false;
showRegisterPassword = false;
showConfirmPassword = false;


  auth: Auth = new Auth();
  model: Register = new Register();
  pwdCriteriaVisible = false;

  private jwtHelper = new JwtHelperService();
  private pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

  get pwdValid() {
    return this.pwdRegex.test(this.model.Password || '');
  }

  get pwdMatch() {
    return this.model.Password === this.model.ConfirmPassword;
  }

  get canSubmitRegister(): boolean {
    return this.pwdValid &&
      !!this.model.FirstName &&
      !!this.model.LastName &&
      !!this.model.EmailAddress &&
      !!this.model.Phone &&
      !!this.model.Password &&
      !!this.model.ConfirmPassword;
  }

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.selectedTab = p['tipo'] === 'login' ? 'login' : 'register';
      this.clearErrors();
    });
  }

  // LOGIN
  onSubmit(): void {
    this.authService.login(this.auth).subscribe({
      next: resp => this.handleLoginSuccess(resp),
      error: () => {
      }
    });
  }

  private handleLoginSuccess(resp: any) {
    if (!resp?.token) return;

    const decoded = this.jwtHelper.decodeToken(resp.token);
    if (decoded.role === 'Admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (resp.isMfaEnabled) {
      this.router.navigate(['/check-mfa']);
    } else {
      this.cartService.syncGuestCartOnLogin();
      this.router.navigate(['/']);
    }
  }

  // REGISTER
  onRegister(): void {
    if (!this.pwdMatch) {
      Swal.fire({
        icon: 'warning',
        text: 'Le password non corrispondono!',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (!this.canSubmitRegister) {
      Swal.fire({
        icon: 'warning',
        text: this.pwdValid
          ? 'Compila tutti i campi correttamente'
          : 'La password non rispetta i criteri richiesti.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.authService.register(this.model).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Registrazione completata',
          confirmButtonColor: '#013220df'
        }).then(() => {
          this.selectedTab = 'login';
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tipo: 'login' },
            queryParamsHandling: 'merge'
          });
        });
      },
      error: () => {
      }
    });
  }

  onPwdChange(): void {
    this.pwdCriteriaVisible = !this.pwdValid && !!this.model.Password;
  }

  public clearErrors() {
  }
}
