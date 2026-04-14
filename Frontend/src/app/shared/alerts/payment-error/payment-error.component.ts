import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-payment-error',
  imports: [],
  templateUrl: './payment-error.component.html',
  styleUrl: './payment-error.component.css'
})
export class PaymentErrorComponent {

@Input({required: true}) role! : string;


}
