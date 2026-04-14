import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomersService } from '../../services/customers.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.css'
})
export class ConfirmEmailComponent implements OnInit {
  public token: string | null = null;
  public confirmationMessage: string | null = null;
  public errorMessage: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomersService);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage = 'Token non valido o mancante.';
      return;
    }

    this.customerService.confirmEmail(this.token).subscribe({
      next: (response) => {
        this.confirmationMessage = response.message;

        this.customerService.getSecurityInfo().subscribe({
          next: (securityData) => {
            this.customerService.setSecurityInfo(securityData);
            this.router.navigate(['/personal-profile/change-security']);
          },
          error: (err) => {
            //console.error('Errore nel caricamento dati sicurezza dopo conferma:', err);
          }
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Errore durante la conferma dell\'email.';
        //console.error('Errore durante la conferma dell\'email:', this.errorMessage);
      }
    });
  }
}
