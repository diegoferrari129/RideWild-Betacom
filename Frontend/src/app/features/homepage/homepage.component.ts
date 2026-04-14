import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProductsService } from '../../services/products.service';
import { OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { addCartItem } from '../../models/cart/addCartItem';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-homepage',
  imports: [RouterModule, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  selectTab: 'bestseller' | 'arrivals' = 'arrivals';
  bestsellers: any[] = [];
  arrivals: any[] = [];
  currentPage = 1;
  pageSize = 15;
  order = 'desc';

  constructor(public authService: AuthService, private productService: ProductsService, private cartService: CartService) { }

  isLogged(): boolean {
    return this.authService.isLoggedCustomer;
  }

  ngOnInit(): void {
    this.bestseller();
    this.OrderByNewest();
  }

  bestseller() {
    this.productService.GetBestsellers(this.currentPage, this.pageSize).subscribe({
      next: (data: any[]) => {
        this.bestsellers = data.slice(0, 4);
        // console.log('Prodotti più acquistati:', data);
      },
      error: (error) => {
        console.error('Errore durante il caricamento dei bestseller:', error);
      }
    });
  }

  OrderByNewest() {
    this.productService.GetProductsByNewest(this.currentPage, this.pageSize, this.order).subscribe({
      next: (arrival: any[]) => {
        this.arrivals = arrival.slice(0, 4);
        // console.log(arrival);
      },
      error: (error) => {
        // console.error('Errore durante il caricamento dei bestseller:', error);
      }
    });
  }
  addToCart(productId: number): void {
    const itemToAdd: addCartItem = {
      productId: productId,
      quantity: 1
    };

    this.cartService.AddCartItem(itemToAdd).subscribe({
      next: (response) => {
        // console.log('Prodotto aggiunto al carrello:', response);
        Swal.fire({
          icon: 'success',
          title: 'Prodotto aggiunto al carrello',
          timer: 2500,
          showConfirmButton: false
        });
      }
    });
  }
}


