import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { OrdersService } from '../../../services/orders.service';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { OrderDetails } from '../../../models/order/orderDetails';
import { Order } from '../../../models/order/order';
import { OrderProductInfo } from '../../../models/order/orderProductInfo';
import { SpinnerComponent } from "../../../shared/spinner/spinner.component";
import { PaymentErrorComponent } from "../../../shared/alerts/payment-error/payment-error.component";

@Component({
  selector: 'app-orders',
  imports: [NgIf, NgFor, DatePipe, SpinnerComponent, CurrencyPipe, PaymentErrorComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {

  isLoading: boolean = false;

  orders: any = [];
  orderDetails: OrderDetails = new OrderDetails();

  destroyRef = inject(DestroyRef);


  statusToString : string = "";

  constructor(private ordSvc: OrdersService) {}

  ngOnInit(): void {
    this.GetOrdersByCustomer();
  }


  GetOrdersByCustomer() { 
    this.isLoading = true;
    this.ordSvc.GetOrdersByCustomerId().subscribe({
      next: (data : any) => {

        data.forEach((item : any) => {
          const order: Order = new Order();

          order.salesOrderId = item.salesOrderId;
          order.orderDate = item.orderDate;
          order.totalDue = parseFloat(item.totalDue.toFixed(2));
          order.status = this.SetOrderStatus(item.status);

          this.orders.push(order);
        })

        this.isLoading = false;
      },
    });
  }

  GetOrderDetails(orderId: number) {
    this.isLoading = true;

    const subscription = this.ordSvc.GetOrderDetails(orderId).subscribe({
      next: (data: any) => {
        this.orderDetails.orderId = data.salesOrderId;
        this.orderDetails.orderDate = new Date(data.orderDate);
        this.orderDetails.shipDate = new Date(data.shipDate);
        this.orderDetails.dueDate = new Date(data.dueDate);
        this.orderDetails.subTotal = data.subTotal;
        this.orderDetails.taxAmt = parseFloat(data.taxAmt.toFixed(2));
        this.orderDetails.freight = data.freight;
        this.orderDetails.totalDue = parseFloat(data.totalDue.toFixed(2));

        this.orderDetails.status = data.status;

        this.statusToString = this.ordSvc.ConvertStatusToString(data.status)

        if (data.shipToAddressId != null) {
          this.orderDetails.shipAddress = `${data.shipToAddress.addressLine1} - ${data.shipToAddress.city} - ${data.shipToAddress.countryRegion}`;
        }

        if (data.shipToAddressId != null) {
          this.orderDetails.billAddress = `${data.billToAddress.addressLine1} - ${data.billToAddress.city} - ${data.billToAddress.countryRegion}`;
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

  SetOrderStatus(statusCode: number) {
    switch (statusCode) {
      case 1:
        return 'In elaborazione';
      case 2:
        return 'Approvato';
      case 3:
        return 'In arretrato';
      case 4:
        return 'Rifiutato';
      case 5:
        return 'Spedito';
      case 6:
        return 'Cancellato';
      default:
        return "Errore";
    }
  }

}
