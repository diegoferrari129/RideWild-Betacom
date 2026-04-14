import { Component } from '@angular/core';
import { ProductsService } from '../../../../services/products.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReviewsService } from '../../../../services/reviews.service';
import { ReviewComponent } from '../../../reviews/reviews.component';
import { ModalUpdateProductComponent } from '../modal-update-product/modal-update-product.component';
import { GoBackButtonComponent } from '../../../../shared/buttons/go-back-button/go-back-button.component';


@Component({
  selector: 'app-product-admin-details',
  imports: [CommonModule, ModalUpdateProductComponent, GoBackButtonComponent],
  templateUrl: './product-admin-details.component.html',
  styleUrl: './product-admin-details.component.css'
})
export class ProductAdminDetailsComponent {

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private reviewsService: ReviewsService
  ) { }

  product: any = null;
  error: string | null = null;

  fetchProduct(id: number) {
    this.productsService.GetProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        //! console.log('Product fetched:', this.product);
      },
      error: () => {
        this.error = 'Errore durante il caricamento.';
      }
    });
  }

  onProductUpdated() {
    this.fetchProduct(this.product.productId); // Refresh the list from backend
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(+id);
      }
    });
  }
}
