import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';
import { Address } from '../../../models/customers';
import { NgFor } from '@angular/common';
import { NewAddressComponent } from '../../../features/personal-profile/addresses/new-address/new-address.component';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-bill-address',
  imports: [NgFor, NewAddressComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './bill-address.component.html',
  styleUrl: './bill-address.component.css',
})
export class BillAddressComponent {
  @Input() form!: FormGroup;
  @Input() listOfAddresses: Address[] | null = [];
}
