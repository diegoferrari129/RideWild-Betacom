import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.css'
})
export class UpdatePasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  passwordValid: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    if (!this.token || !this.newPassword || !this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        text: 'Inserisci tutti i campi richiesti.',
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

    this.authService.updatePassword(this.token, this.newPassword).subscribe({
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
