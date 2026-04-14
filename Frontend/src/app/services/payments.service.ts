import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {

  localhostPayment : string = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(orderId: number) {
    return this.http.post<{ url: string }>(
      this.localhostPayment + "/create-checkout-session",
      orderId
    );
  }
}
