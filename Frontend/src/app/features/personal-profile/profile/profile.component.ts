import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CustomersService } from '../../../services/customers.service';
import { Customer } from '../../../models/customers';
import { NgIf } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  customer: Customer | null = null;
  form!: FormGroup;
  modified = false;
  private customerService = inject(CustomersService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.modified = false;

    const currentCustomer = this.customerService.getCurrentCustomer();

    if (currentCustomer) {
      this.customer = currentCustomer;
      this.initForm(currentCustomer);
    } else {
      this.customerService.getCustomerInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.customer = data;
            this.customerService.setCustomer(data);
            this.initForm(data);
          },
          error: (err) => {
            //console.error('Errore nel recupero del cliente:', err);
          }
        });
    }

    this.customerService.customerSource$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.customer = data;
          if (this.form) {
            this.form.patchValue(data);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (!this.form.valid || !this.customer) {
      //console.warn('Form non valido o customer null');
      return;
    }

    const updatedCustomer: Customer = {
      ...this.customer,
      ...this.form.value
    };

    this.customerService.updateCustomer(updatedCustomer)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          Swal.fire({
                            icon: 'success',
                            title: 'Dati personali aggiornati con successo',
                            confirmButtonColor: '#013220df'
          });
          this.customer = res;
          this.modified = true;
          this.customerService.setCustomer(res);
          //console.log('Cliente aggiornato con successo:', res);
        },
        error: (err) => {
          //console.error('Errore aggiornamento cliente:', err);
        }
      });
  }

  private initForm(customer: Customer): void {
    this.form = new FormGroup({
      firstName: new FormControl(customer.firstName, Validators.required),
      lastName: new FormControl(customer.lastName, Validators.required),
      suffix: new FormControl(customer.suffix),
      companyName: new FormControl(customer.companyName),
    });
  }
}
