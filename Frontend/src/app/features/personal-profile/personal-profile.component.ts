import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CustomersService } from '../../services/customers.service';
import { Customer } from '../../models/customers';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personal-profile',
  standalone: true,
  imports: [RouterOutlet, RouterModule, NgIf],
  templateUrl: './personal-profile.component.html',
  styleUrl: './personal-profile.component.css'
})
export class PersonalProfileComponent implements OnInit, OnDestroy {
  public customer: Customer | null = null;
  private customerService = inject(CustomersService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}
  
  ngOnInit(): void {
    const current = this.customerService.getCurrentCustomer();

    if (current) {
      this.customer = current;
    } else {
      this.customerService.getCustomerInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.customer = data;
            this.customerService.setCustomer(data);
          },
          error: (err) => {
            //console.error('Errore nel caricamento profilo:', err);
          }
        });
    }

    this.customerService.customerSource$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        if (updated) {
          this.customer = updated;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
