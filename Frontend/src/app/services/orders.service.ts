import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, input, signal } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { NewOrder } from '../models/order/newOrder';
import { BehaviorSubject, catchError, Observable } from 'rxjs';
import { Order } from '../models/order/order';
import { OrderDetails } from '../models/order/orderDetails';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  localHostOrders: string = `${environment.apiUrl}/orders/`;

  constructor(private http: HttpClient) {}

  GetOrders(page: number = 1, pageSize: number = 20) {
    return this.http.get<Order[]>(
      `${this.localHostOrders}?page=${page}&pageSize=${pageSize}`
    );
  }

  GetOrderDetails(orderId: number) {
    return this.http.get<OrderDetails>(this.localHostOrders + orderId);
  }

  SearchOrder(orderId: number) {
    return this.http.get<Order>(`${this.localHostOrders}search/${orderId}`);
  }

  GetOrdersByCustomerId() {
    return this.http.get(this.localHostOrders + 'customer');
  }

  // PostOrder(newOrder: NewOrder): Observable<HttpResponse<any>> {
  //   return this.http.post(this.localHostOrders, newOrder, {
  //     observe: 'response',
  //   });
  // }

  PostOrder(order: NewOrder) {
    return this.http.post<{ salesOrderId: number }>(this.localHostOrders, order, {
      observe: 'response',
    });
  }

  ConvertStatusToString(statusCode: number): string {
    switch (statusCode) {
      case 1:
        return 'In elaborazione';
      case 2:
        return 'Approvato';
      case 3:
        return 'In attesa';
      case 4:
        return 'Rifiutato';
      case 5:
        return 'Spedito';
      case 6:
        return 'Cancellato';
      default:
        return 'Errore';
    }
  }

  UpdateStatus(orderId: number, statusCode: number): Observable<Order> {
    return this.http.patch<Order>(this.localHostOrders + 'status', {
      OrderId: orderId,
      Status: statusCode,
    });
  }

  DeleteOrder(orderId: number): Observable<any> {
    return this.http.delete<any>(this.localHostOrders + orderId);
  }
}
