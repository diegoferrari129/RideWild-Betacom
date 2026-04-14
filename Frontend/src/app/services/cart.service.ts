
import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, of, map } from 'rxjs';
import { tap } from 'rxjs';
import { cartItem } from '../models/cart/cartItem';
import { addCartItem } from '../models/cart/addCartItem';
import { updateCartItem } from '../models/cart/updateCartItem';
import { AuthService } from './auth.service';
import { ProductsService } from './products.service';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class CartService {

  cartApiUrl: string = `${environment.apiUrl}/Carts/`;

  private readonly localStorageKey = 'cartItems';

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  private cartProductIdSubject = new BehaviorSubject<number[]>([]);
  cartProductId$ = this.cartProductIdSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private productsService: ProductsService) {

    this.counter();
  }

  counter(): void {

    this.GetCartItem().subscribe(items => {

      const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
      const productIds = items.map(item => item.productId);

      this.cartCountSubject.next(totalCount);
      this.cartProductIdSubject.next(productIds);

    })

  }

  getLocalCart(): cartItem[] {

    const cartItemsJson = localStorage.getItem(this.localStorageKey);
    return cartItemsJson ? JSON.parse(cartItemsJson) : [];

  }

  setLocalCart(cartItems: cartItem[]): void {

    localStorage.setItem(this.localStorageKey, JSON.stringify(cartItems));

  }

  GetCartItem(): Observable<cartItem[]> {

    if (this.authService.isLoggedCustomer)
      return this.http.get<cartItem[]>(`${this.cartApiUrl}get`);

    else {
      return of(this.getLocalCart());
    }

  }

  UpdateCartItem(itemToUpdate: updateCartItem): Observable<any> {

    if (this.authService.isLoggedCustomer) {

      return this.http.put(`${this.cartApiUrl}update`, itemToUpdate)
        .pipe(tap(() => this.counter())
        );
    } else {

      const localCart = this.getLocalCart();
      const existingItem = localCart.find(item => item.cartItemId === itemToUpdate.cartItemId);

      if (existingItem) {
        existingItem.quantity = itemToUpdate.quantity;
        existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;

        this.setLocalCart(localCart);
        this.counter();
        return of(existingItem);
      } else {

        return of(null);

      }
    }
  }

  AddCartItem(itemToAdd: addCartItem): Observable<cartItem> {

    if (this.authService.isLoggedCustomer) {

      return this.http.post<cartItem>(`${this.cartApiUrl}add`, itemToAdd)
        .pipe(tap(() => this.counter())
        );
    } else {

      const localCart = this.getLocalCart();
      const existingItem = localCart.find(item => item.productId === itemToAdd.productId);

      if (existingItem) {
        existingItem.quantity += itemToAdd.quantity;
        existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;

        this.setLocalCart(localCart);
        this.counter();
        return of(existingItem);
      } else {

        return this.productsService.GetProductById(itemToAdd.productId).pipe(
          map(product => {

            const newItem: cartItem = {
              cartItemId: Date.now(),
              productId: itemToAdd.productId,
              productName: product.name,
              quantity: itemToAdd.quantity,
              unitPrice: product.listPrice,
              totalPrice: product.listPrice * itemToAdd.quantity,
              productImage: product.thumbNailPhotoBase64

            };

            localCart.push(newItem);
            this.setLocalCart(localCart);
            this.counter();
            return newItem;
          })
        );
      }
    }
  }

  ClearCartItems(): Observable<any> {

    if (this.authService.isLoggedCustomer) {

      return this.http.delete(`${this.cartApiUrl}clear`)
        .pipe(tap(() => {

          this.cartCountSubject.next(0);
          this.cartProductIdSubject.next([]);

        })
        );
    } else {

      localStorage.removeItem(this.localStorageKey);
      this.cartCountSubject.next(0);
      this.cartProductIdSubject.next([]);
      return of(null);

    }
  }

  RemoveCartItem(cartItemId: number): Observable<any> {

    if (this.authService.isLoggedCustomer) {

      return this.http.delete(`${this.cartApiUrl}remove/${cartItemId}`)
        .pipe(tap(() => this.counter())
        );
    } else {

      const localCart = this.getLocalCart();
      const updatedCart = localCart.filter(item => item.cartItemId !== cartItemId);

      this.setLocalCart(updatedCart);
      this.counter();

      return of(null);

    }
  }

  calculateSubtotal(items: cartItem[]): number {
    return items.reduce((acc, item) => acc + item.totalPrice, 0);
  }

  calculateTaxAmount(subtotal: number): number {
    return subtotal * 0.22;
  }

  syncGuestCartOnLogin(): void {

    const guestItems = this.getLocalCart();

    if (guestItems.length === 0)
      return;

    const addRequests = guestItems.map(item => {
      const addItem: addCartItem = {
        productId: item.productId,
        quantity: item.quantity
      };
      return this.http.post<cartItem>(`${this.cartApiUrl}add`, addItem);
    });

    forkJoin(addRequests).subscribe({
      next: () => {
        localStorage.removeItem(this.localStorageKey);
        this.counter();
      },
    });
  }
} 