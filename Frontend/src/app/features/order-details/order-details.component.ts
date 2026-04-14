import { Component, DestroyRef, inject, output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderDetails } from '../../models/order/orderDetails';
import { OrdersService } from '../../services/orders.service';
import { OrderProductInfo } from '../../models/order/orderProductInfo';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { GoBackButtonComponent } from '../../shared/buttons/go-back-button/go-back-button.component';
import { EditStatusOrderButtonComponent } from '../../shared/buttons/edit-status-order-button/edit-status-order-button.component';
import { DeleteOrderButtonComponent } from '../../shared/buttons/delete-order-button/delete-order-button.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { PaymentErrorComponent } from "../../shared/alerts/payment-error/payment-error.component";

@Component({
  selector: 'app-order-details',
  imports: [
    DatePipe,
    CurrencyPipe,
    GoBackButtonComponent,
    EditStatusOrderButtonComponent,
    DeleteOrderButtonComponent,
    SpinnerComponent,
    PaymentErrorComponent
],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
})
export class OrderDetailsComponent {
  orderId: number = 0;
  isLoading: boolean = false;
  statusString: string = '';

  destroyRef = inject(DestroyRef);

  orderDetails: OrderDetails = new OrderDetails();

  now = new Date();

  constructor(
    private route: ActivatedRoute,
    private ordSvc: OrdersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("oninit")
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.GetOrderDetails(this.orderId);
  }

  handleStatusUpdated() {
    console.log("handlestatus")
    this.GetOrderDetails(this.orderId);
  }

  handleDelete() {
    this.router.navigate(['/admin-dashboard/orders']);
  }

  GetOrderDetails(orderId: number) {
    this.isLoading = true;

    const subscription = this.ordSvc.GetOrderDetails(orderId).subscribe({
      next: (data: any) => {
        console.log(data)

        this.orderDetails.orderId = data.salesOrderId;
        this.orderDetails.orderDate = new Date(data.orderDate);

        this.orderDetails.shipDate = data.shipDate ? new Date(data.shipDate) : null;

        this.orderDetails.dueDate = new Date(data.dueDate);

        if (data.customer.middleName != null) {
          this.orderDetails.customerFullName = `${data.customer.firstName} ${data.customer.middleName} ${data.customer.lastName}`;
        } else {
          this.orderDetails.customerFullName = `${data.customer.firstName} ${data.customer.lastName}`;
        }

        this.orderDetails.subTotal = data.subTotal;
        this.orderDetails.taxAmt = data.taxAmt;
        this.orderDetails.freight = data.freight;
        this.orderDetails.totalDue = data.totalDue;

        this.orderDetails.status = data.status;

        if (data.shipToAddressId != null) {
          this.orderDetails.shipAddress = `${data.shipToAddress.addressLine1}, ${data.shipToAddress.city}, ${data.shipToAddress.countryRegion}`;
        }

        if (data.shipToAddressId != null) {
          this.orderDetails.billAddress = `${data.billToAddress.addressLine1}, ${data.billToAddress.city}, ${data.billToAddress.countryRegion}`;
        }

        this.orderDetails.productsInfo = []; // Inizializza UNA SOLA VOLTA

        data.salesOrderDetails.forEach((item: any) => {
          const productInfo: OrderProductInfo = new OrderProductInfo();

          productInfo.salesOrderDetailId = item.salesOrderDetailId;
          productInfo.productId = item.productId;
          productInfo.orderQty = item.orderQty;
          productInfo.unitPrice = item.unitPrice;
          productInfo.unitPriceDiscount = item.unitPriceDiscount;
          productInfo.lineTotal = item.lineTotal;

          productInfo.productName = item.product.name;
          productInfo.productColor = item.product.color;
          productInfo.productSize = item.product.size;
          productInfo.productImage = item.product.thumbNailPhoto;

          this.orderDetails.productsInfo.push(productInfo);
        });

        console.log(this.orderDetails);

        this.statusString = this.ordSvc.ConvertStatusToString(
          this.orderDetails.status
        );

        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
      },
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
