// src/app/features/search-results/search-results.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { SearchbarService } from '../../services/searchbar.service';
import { ProductSearchDto } from '../../models/product-search';
import { RouterModule } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { addCartItem } from '../../models/cart/addCartItem';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-search-results',
  imports: [CommonModule, RouterModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit, OnDestroy {

  products: ProductSearchDto[] = [];
  loading = true;
  errorMsg = '';

  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private srv: ProductsService,
    private searchSrv: SearchbarService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.sub = this.route.queryParamMap
      .pipe(
        switchMap(map => {
          const q = (map.get('q') || '').trim();
          if (!q) {
            this.router.navigate(['/products']);
            return [];
          }
          this.loading = true;
          this.errorMsg = '';
          return this.searchSrv.searchProducts(q);
        })
      )
      .subscribe({
        next: res => { this.products = res; this.loading = false; },
        error: err => {
          this.loading = false;
          this.errorMsg =
            err.status === 404 ? 'Nessun prodotto trovato'
              : (err.error ?? 'Errore imprevisto');
        }
      });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

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
                  confirmButtonColor: '#013220df'
                });
              },
      });
    }
}
