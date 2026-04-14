import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { OrdersService } from '../../../services/orders.service';
import { OrderDetails } from '../../../models/order/orderDetails';
import { Order } from '../../../models/order/order';
import { OrderProductInfo } from '../../../models/order/orderProductInfo';
import { RouterModule } from '@angular/router';
import { GoBackButtonComponent } from '../../../shared/buttons/go-back-button/go-back-button.component';
import { SpinnerComponent } from '../../../shared/spinner/spinner.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IfStmt } from '@angular/compiler';

@Component({
  selector: 'app-orders',
  imports: [
    DatePipe,
    CurrencyPipe,
    RouterModule,
    GoBackButtonComponent,
    SpinnerComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent {
  isLoading: boolean = false;

  ordersList: Order[] = [];
  orderDetails: OrderDetails = new OrderDetails();

  currentPage: number = 1;
  pageSize: number = 20;
  totalOrders: number = 0;

  form = new FormGroup({
    searchId: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
      ],
    }),
  });

  get searchIdInvalid() {
    return (
      this.form.controls.searchId.dirty &&
      this.form.controls.searchId.touched &&
      this.form.controls.searchId.invalid
    );
  }

  constructor(private ordSvc: OrdersService) {}

  ngOnInit(): void {
    this.GetOrders();

  }

  GetOrders(): void {
    this.isLoading = true;

    let orders: Order[] = [];

    this.ordSvc.GetOrders(this.currentPage, this.pageSize).subscribe({
      next: (data: any) => {
        data.orders.forEach((o: any) => {
          let order: Order = new Order();

          order.salesOrderId = o.salesOrderId;
          order.orderDate = o.orderDate;
          order.totalDue = o.totalDue;
          order.status = this.ordSvc.ConvertStatusToString(o.status);

          orders.push(order);
        });

        this.ordersList = orders;

        this.totalOrders = data.totalCount;

        this.isLoading = false;
      },
    });
  }

  SearchOrder(): void {
    if (this.form.invalid) {
      alert('Inserisci un id valido, di almeno 5 cifre');
      return;
    }

    const searchId: number = parseInt(this.form.value.searchId!);

    if (isNaN(searchId)) {
      alert('Inserisci un id valido');
      return;
    }

    this.isLoading = true;

    this.ordSvc.SearchOrder(searchId).subscribe({
      next: (o: Order) => {
        let order: Order = new Order();

        order.salesOrderId = o.salesOrderId;
        order.orderDate = o.orderDate;
        order.totalDue = o.totalDue;
        order.status = this.ordSvc.ConvertStatusToString(parseInt(o.status));

        console.log('order: ' + order);

        this.ordersList = [];
        this.ordersList.push(order);

        this.totalOrders = 1;

        console.log(this.orderDetails);
      },
      error: (err) => {
        console.log(err);
        alert('Ordine non trovato');
        this.form.reset();
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  resetOrders() : void {
    this.GetOrders();
    this.form.reset();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > Math.ceil(this.totalOrders / this.pageSize)) return;

    this.currentPage = page;
    this.GetOrders();
  }
}
