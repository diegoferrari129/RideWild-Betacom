import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CustomersService } from '../../../services/customers.service';
import { Address } from '../../../models/customers';
import { NgFor } from '@angular/common';
import { NewAddressComponent } from './new-address/new-address.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [NgFor, NewAddressComponent],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.css'
})
export class AddressesComponent implements OnInit, OnDestroy {
  customerAddresses: Address[] | null = [];
  private destroy$ = new Subject<void>();
  private customerService = inject(CustomersService);

  ngOnInit(): void {
    const cached = this.customerService.getCurrentAddresses();

    if (!cached || cached.length === 0) {
      this.customerService.getAddresses()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (addresses: Address[]) => {
            this.customerService.setAddresses(addresses);
          },
          error: (err) => {
            //console.error('Errore nel recupero indirizzi:', err);
          }
        });
    }

    this.customerService.customerAddresses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(addresses => {
        this.customerAddresses = addresses;
      });
  }

  removeAddress(addressId: number): void {
    this.customerService.removeAddress(addressId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const current = this.customerService['customerAddresses'].getValue();
          if (!current) return;
          const updated = current.filter(addr => addr.addressId !== addressId);
          this.customerService.setAddresses(updated);
          //console.log('Indirizzo rimosso con successo');
        },
        error: (err) => {
          //console.error('Errore nella rimozione dell’indirizzo:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
