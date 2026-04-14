import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../services/products.service';
import { ReviewsService } from '../../services/reviews.service';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { CustomersService } from '../../services/customers.service';
import { Customer } from '../../models/customers';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { Review } from '../../models/reviews';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewComponent implements OnInit {
  product: any = null;
  loading = true;
  error: string | null = null;
  reviews: any[] = [];
  newReview = {
    Title: '',
    Text: '',
    createdOn: new Date(),
    Rating: 0
  };

  public customer: Customer | null = null;
  private customerService = inject(CustomersService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  get isUser(): boolean { return this.authService.isLoggedCustomer; }
  get isAdmin(): boolean { return this.authService.isLoggedAdmin; }
  get isLogged(): boolean { return this.isUser || this.isAdmin; }
  get notLogged(): boolean { return !this.isAdmin || !this.isUser; }

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private reviewsService: ReviewsService
  ) {}

 ngOnInit(): void {
  if (this.authService.isLoggedCustomer || this.authService.isLoggedAdmin) {
    const cached = this.customerService.getCurrentCustomer();
    if (cached) {
      this.customer = cached;
    } else {
      this.customerService.getCustomerInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.customer = data;
            this.customerService.setCustomer(data);
          },
          error: () => {
          }
        });
    }

    this.customerService.customerSource$
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => {
        if (updated) {
          this.customer = updated;
        }
      });
  }

  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.fetchProduct(+id);
      this.fetchReviews(+id);
    }
  });
}


  fetchProduct(id: number): void {
    this.productsService.GetProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: () => {
        this.error = 'Errore durante il caricamento.';
        this.loading = false;
      }
    });
  }

  fetchReviews(id: number): void {
    this.reviewsService.getReviewsByProductId(id).subscribe({
      next: (review) => {
        this.reviews = review;
        this.loading = false;
      },
      error: () => {
        this.error = 'Errore durante il caricamento.';
        this.loading = false;
      }
    });
  }

  submitReview(): void {
    if (!this.customer) {
      Swal.fire({
        icon: 'warning',
        text: 'Effettua l\'accesso per inviare una recensione.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const review: Review = {
      productId: this.product.productId,
      fullName: `${this.customer.firstName} ${this.customer.lastName}`,
      title: this.newReview.Title,
      text: this.newReview.Text,
      createdOn: new Date(),
      rating: this.newReview.Rating,
      isPositive: this.newReview.Rating >= 4
    };

    this.reviewsService.postReview(review).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Recensione inviata con successo!',
          confirmButtonColor: '#013220df'
        });

        this.fetchReviews(this.product.productId);
        this.newReview = {
          Title: '',
          Text: '',
          createdOn: new Date(),
          Rating: 0
        };
      },
      error: () => {
        
      }
    });
  }
}
