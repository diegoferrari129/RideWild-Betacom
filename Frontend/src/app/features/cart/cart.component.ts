
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { cartItem } from '../../models/cart/cartItem';
import { updateCartItem } from '../../models/cart/updateCartItem';
import { addCartItem } from '../../models/cart/addCartItem';
import { CurrencyPipe, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  imports: [NgFor, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})

export class CartComponent implements OnInit {
  Items: cartItem[] = [];

  subtotal: number = 0;
  tax: number = 0;
  standardShippingCost: number = 0;
  totalDue: number = 0;

  constructor(
    private cartService: CartService,
  ) { }

  ngOnInit(): void {
    this.GetCart();
  }

  GetCart() {
    this.cartService.GetCartItem().subscribe({
      next: (data) => {

        this.Items = data;

        this.updateCosts(this.Items)
      }
    });
  }

  updateCosts(items: cartItem[]) {
    this.subtotal = this.cartService.calculateSubtotal(items);
    this.tax = parseFloat(this.cartService.calculateTaxAmount(this.subtotal).toFixed(2))
    this.standardShippingCost = 5;
    this.totalDue = parseFloat((this.subtotal + this.tax + this.standardShippingCost).toFixed(2));
  }

  AddCartItem(productId: number, quantity: number) {
    const itemToAdd: addCartItem = {
      productId: productId,
      quantity: quantity
    };
    this.cartService.AddCartItem(itemToAdd).subscribe({
      next: () => {
        this.GetCart();
      },
    });
  }

  UpdateCartItem(cartItemId: number, quantity: number) {
    const itemToUpdate: updateCartItem = {
      cartItemId: cartItemId,
      quantity: quantity
    };
    this.cartService.UpdateCartItem(itemToUpdate).subscribe({
      next: () => {
        this.GetCart();
      },
    });
  }

  DeleteCartItem(itemId: number) {
    this.cartService.RemoveCartItem(itemId).subscribe({
      next: () => {
        this.GetCart();
      },
    });
  }

  ClearCart() {
    this.cartService.ClearCartItems().subscribe({
      next: () => {
        this.GetCart();
      },
    });
  }

  calculateSubtotal(): number {
    return this.Items.reduce((acc, item) => acc + item.totalPrice, 0);
  }

}