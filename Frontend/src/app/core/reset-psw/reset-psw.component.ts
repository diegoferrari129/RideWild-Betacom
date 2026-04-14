import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-psw',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-psw.component.html',
  styleUrl: './reset-psw.component.css'
})
export class ResetPSWComponent implements OnInit {
  token: string | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  passwordValid: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit(): void {
    if (!this.token || !this.newPassword) {
      Swal.fire({
        icon: 'warning',
        text: 'Il token o la nuova password è mancante.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        text: 'Le password non corrispondono.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Password aggiornata con successo!',
          confirmButtonColor: '#013220df'
        }).then(() => {
          this.router.navigate(['/login'], { queryParams: { tipo: 'login' } });
        });
      },
      error: () => {
        
      }
    });
  }

  validatePassword(): void {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    this.passwordValid = regex.test(this.newPassword);
  }
}
