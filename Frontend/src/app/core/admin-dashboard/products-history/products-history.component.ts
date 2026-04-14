import { Component } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GoBackButtonComponent } from '../../../shared/buttons/go-back-button/go-back-button.component';
import { ModalAddProductsComponent } from './modal-add-products/modal-add-products.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-products-history',
  imports: [FormsModule, CommonModule, GoBackButtonComponent, ModalAddProductsComponent, RouterModule],
  templateUrl: './products-history.component.html',
  styleUrl: './products-history.component.css'
})
export class ProductsHistoryComponent {
  constructor(private productsService: ProductsService) { }

  onProductAdded() {
    this.OrderByNewestAdmin(); // Refresh the list from backend
  }

  products: any[] = [];
  productId: number = 0; // ID del prodotto da eliminare
  currentPage: number = 1; // Pagina corrente per la paginazione
  pageSize: number = 20; // Numero di prodotti per pagina
  allLoaded: boolean = false; // Flag per indicare se tutti i prodotti sono stati caricati
  totalCount: number = 0; // Total count of products for pagination


  // TODO: funzione per tutti i prodotti in ordine discendente
  OrderByNewestAdmin() {
    this.allLoaded = false;
    this.products = []; // Clear the existing products array before fetching new data

    this.productsService.GetProductsByNewestAdmin(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        //! console.log(data);
        // Append new products to the existing array
        this.products = Array.isArray(data.products) ? data.products : [];
        this.totalCount = data.totalCount;
        //! console.log('Total products:', this.totalCount);
        //! console.log('Products:', this.products);
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  // ! No perchè ci sarebbe il bisogno di rimuovere tutte le colonne a cascata dove prouctId è presente
  // DeleteProduct(productId: number) {
  //   this.productId = productId; // Set the productId to the one being deleted
  //   this.productsService.DeleteProduct(productId).subscribe({
  //     next: (productId) => {
  //       console.log('Product deleted successfully:', productId);
  //       // Rimuovi il prodotto dalla lista dei prodotti
  //       this.products = this.products.filter(product => product.id !== productId);
  //       // Opzionale: Aggiorna il conteggio totale dei prodotti
  //       this.totalCount = this.products.length; // Update total count after deletion
  //       // location.reload(); // Ricarica la pagina per aggiornare la visualizzazione
  //     },
  //   })
  // }

  // Funzione per la paginazione

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  onPageChange(page: number) {
    if (page < 1 || page > Math.ceil(this.totalCount / this.pageSize)) return;

    this.currentPage = page;
    this.OrderByNewestAdmin();
  }

  ngOnInit() {
    // Chiamata al metodo per leggere i prodotti
    this.OrderByNewestAdmin();
  }
}