import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../services/products.service';
import { ReviewsService } from '../../../services/reviews.service';
import { FormsModule } from '@angular/forms';
import { ReviewComponent } from '../../../core/reviews/reviews.component';
import { CartService } from '../../../services/cart.service';
import { addCartItem } from '../../../models/cart/addCartItem';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, FormsModule, ReviewComponent],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  product: any = null;
  loading = true;
  productLoaded = false;
  reviewsLoaded = false;
  error: string | null = null;
  reviews: any[] = [];
  newReview = {
    Title: '',
    Text: '',
    createdOn: new Date(),
    Rating: 0
  };

  get isUser(): boolean { return this.authService.isLoggedCustomer; }
  get isAdmin(): boolean { return this.authService.isLoggedAdmin; }
  get isLogged(): boolean { return this.isUser || this.isAdmin; }
  get notLogged(): boolean { return !this.isAdmin || !this.isUser; }

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private reviewsService: ReviewsService,
    private cartService: CartService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.productLoaded = false;
    this.reviewsLoaded = false;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(+id);
        this.fetchReviews(+id);
      }
    });
  }

  fetchProduct(id: number) {
    this.productsService.GetProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        setTimeout(() => {
          this.productLoaded = true;
          this.loading = !(this.productLoaded && this.reviewsLoaded);
        }, 1000);
      },
      error: () => {
        this.error = 'Errore durante il caricamento.';
        setTimeout(() => {
          this.productLoaded = true;
          this.loading = !(this.productLoaded && this.reviewsLoaded);
        }, 1000);
      }
    });
  }
  fetchReviews(id: number) {
    this.reviewsService.getReviewsByProductId(id).subscribe({
      next: (review) => {

        // console.log('RECENSIONI:', review);
        this.reviews = review;
        setTimeout(() => {
          this.reviewsLoaded = true;
          this.loading = !(this.productLoaded && this.reviewsLoaded);
        }, 1000);
      },
      error: () => {
        this.error = 'Errore durante il caricamento.';
        setTimeout(() => {
          this.reviewsLoaded = true;
          this.loading = !(this.productLoaded && this.reviewsLoaded);
        }, 1000);
        console.log(this.error)
      }
    })
  }
  addToCart(productId: number): void {
    const itemToAdd: addCartItem = {
      productId: productId,
      quantity: 1
    };

    this.cartService.AddCartItem(itemToAdd).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Prodotto aggiunto al carrello',
          timer: 2500,
          showConfirmButton: false
        });
      },
    })
  }
}
