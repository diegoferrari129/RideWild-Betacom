import { Component, Input } from '@angular/core';
import { ShipAddressComponent } from './ship-address/ship-address.component';
import { BillAddressComponent } from './bill-address/bill-address.component';
import { PaymentMethodComponent } from './payment-method/payment-method.component';
import { ShipMethodComponent } from './ship-method/ship-method.component';
import { CurrencyPipe, Location, NgFor } from '@angular/common';
import { OrdersService } from '../../services/orders.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { cartItem } from '../../models/cart/cartItem';
import { HttpResponse, HttpStatusCode } from '@angular/common/http';
import { NewOrderProductInfo } from '../../models/order/newOrderProductInfo';
import { NewOrder } from '../../models/order/newOrder';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CustomersService } from '../../services/customers.service';
import { Address } from '../../models/customers';
import { GoBackButtonComponent } from '../../shared/buttons/go-back-button/go-back-button.component';
import { PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'app-checkout',
  imports: [
    NgFor,
    ShipAddressComponent,
    BillAddressComponent,
    ShipMethodComponent,
    ReactiveFormsModule,
    CurrencyPipe,
    GoBackButtonComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  checkoutForm = new FormGroup({
    shipAddress: new FormControl<string>('', Validators.required),
    billAddress: new FormControl<string>('', Validators.required),
    shipMethod: new FormControl<string>('', Validators.required),
  });

  subtotal: number = 0;
  taxAmount: number = 0;
  totalDue: number = 0;

  shippingCost: number = 0;

  listOfAddresses: Address[] | null = [];

  cartItems: cartItem[] = [];

  constructor(
    private _location: Location,
    private ordSvc: OrdersService,
    private crtSvc: CartService,
    private router: Router,
    private cusSvc: CustomersService,
    private paySvc: PaymentsService
  ) { }

  ngOnInit(): void {
    // spedizione di default
    this.shippingCost = 0;

    this.GetAddresses();

    const x = this.crtSvc.GetCartItem().subscribe({
      next: (data: any) => {
        // console.log('data', data);

        if (data.total === 0) {
          alert('Carrello vuoto, torna alla home');
          this.router.navigate(['/']);
        }

        this.cartItems = data;
        this.subtotal = this.crtSvc.calculateSubtotal(this.cartItems);
        this.taxAmount = this.subtotal * 0.22;

        this.updateTotalDue();
      },
      error: (err) => {
        console.error('Errore nel recupero del carrello', err);
      },
    });
  }

  onSelectShipMethod(cost: number) {
    console.log(cost);
    this.shippingCost = cost;
    this.updateTotalDue();
  }

  backClicked() {
    this._location.back();
  }

  GetAddresses() {
    const cached = this.cusSvc.getCurrentAddresses();
    if (!cached || cached.length === 0) {
      this.cusSvc.getAddresses().subscribe({
        next: (addresses: Address[]) => {
          this.cusSvc.setAddresses(addresses);
        },
        error: (err) => {
          console.error('Errore nel recupero indirizzi:', err);
        },
      });
    }

    this.cusSvc.customerAddresses$.subscribe((addresses) => {
      this.listOfAddresses = addresses;
    });
  }

  updateTotalDue() {
    this.totalDue = parseFloat(
      (this.subtotal + this.taxAmount + this.shippingCost).toFixed(2)
    );
  }

  onSubmit(): void {
    console.log('nel submit');
    if (this.checkoutForm.invalid) {
      alert('Form non valido');
      return;
    }

    console.log(this.checkoutForm.value);

    // this.CreateOrder();
    this.CreateOrderAndPayment();
  }

  private CreateOrder() {
    const newOrder: NewOrder = new NewOrder();

    newOrder.shipToAddressId = parseInt(this.checkoutForm.value.shipAddress!);
    newOrder.billToAddressId = parseInt(this.checkoutForm.value.billAddress!);
    newOrder.freight = parseInt(this.checkoutForm.value.shipMethod!);

    newOrder.shipMethod = newOrder.freight === 5 ? 'Standard' : 'Veloce';

    this.cartItems.forEach((item) => {
      let newOrderProductInfo = new NewOrderProductInfo();

      newOrderProductInfo.productId = item.productId;
      newOrderProductInfo.orderQty = item.quantity;
      newOrderProductInfo.unitPrice = item.unitPrice;

      newOrderProductInfo.unitPriceDiscount = 0;

      newOrder.orderDetails.push(newOrderProductInfo);
    });

    console.log('newOrder', newOrder);

    // svuoto carrello
    this.crtSvc.ClearCartItems().subscribe({
      next: (response: any) => console.log(response),
    });

    this.ordSvc.PostOrder(newOrder).subscribe({
      next: (response) => {
        console.log(response);

        if (response.status === HttpStatusCode.Created) {
          alert('Ordine effettuato');

          // redirect
          this.router.navigate(['/success']);
        }
      },
      error: (err: any) => {
        console.log('errore' + err.status);
      },
    });
  }

  private CreateOrderAndPayment() {
    const newOrder: NewOrder = new NewOrder();

    newOrder.shipToAddressId = parseInt(this.checkoutForm.value.shipAddress!);
    newOrder.billToAddressId = parseInt(this.checkoutForm.value.billAddress!);
    newOrder.freight = parseInt(this.checkoutForm.value.shipMethod!);
    newOrder.shipMethod = newOrder.freight === 5 ? 'Standard' : 'Veloce';

    this.cartItems.forEach((item) => {
      let product = new NewOrderProductInfo();
      product.productId = item.productId;
      product.orderQty = item.quantity;
      product.unitPrice = item.unitPrice;
      product.unitPriceDiscount = 0;
      newOrder.orderDetails.push(product);
    });

    // STEP 1: crea ordine
    this.ordSvc.PostOrder(newOrder).subscribe({
      next: (response) => {
        console.log('response', response);
        console.log('orderId', response.body?.salesOrderId);

        const orderId = response.body?.salesOrderId;

        if (!orderId) {
          alert('Errore: orderId non ricevuto');
          return;
        }

        // svuoto carrello
        this.crtSvc.ClearCartItems().subscribe({
          next: (response: any) => console.log(response),
        });

        // STEP 2: crea checkout session
        this.paySvc.createCheckoutSession(orderId).subscribe({
          next: (res) => {
            // STEP 3: redirect a Stripe
            window.location.href = res.url;
          },
          error: (err) => {
            console.error('Errore nella creazione sessione Stripe:', err);
            alert('Errore pagamento');
          },
        });
      },
      error: (err) => {
        console.error('Errore creazione ordine:', err);
        alert('Errore creazione ordine');
      },
    });
  }
}
