import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomersService } from '../../../services/customers.service';
import { Address } from '../../../models/customers';
import { NgFor } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewAddressComponent } from '../../../features/personal-profile/addresses/new-address/new-address.component';

@Component({
  selector: 'app-ship-address',
  imports: [NgFor, FormsModule, NewAddressComponent, ReactiveFormsModule],
  templateUrl: './ship-address.component.html',
  styleUrl: './ship-address.component.css',
})
export class ShipAddressComponent {
  @Input() form!: FormGroup;
  @Input() listOfAddresses: Address[] | null = [];

}
