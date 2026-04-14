import { Component, inject, signal, TemplateRef, WritableSignal } from '@angular/core';
// devo importare CommonModule per far partire le api
import { CommonModule } from '@angular/common';
// importare ProductsService per far partire le api
import { ProductsService } from '../../services/products.service';
import { FormsModule } from '@angular/forms';
// aggiunta del prodotto al carrello
import { CartService } from '../../services/cart.service';
import { addCartItem } from '../../models/cart/addCartItem';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})

export class ProductsComponent {
  constructor(private productsService: ProductsService, private cartService: CartService) { }

  products: any[] = [];
  categories: any[] = [];
  selectedCategories: number[] = [];
  page: number = 1;
  pageSize: number = 15;
  order: 'asc' | 'desc' | null = null;
  allLoaded: boolean = false;
  productId: number[] = [];


  // TODO: PRODOTTI
  ReadProducts() {
    this.allLoaded = false;
    this.order = null;
    this.productsService.GetProducts(this.page, this.pageSize).subscribe({
      next: (data: any[]) => {
        //! console.log(data);
        // appende i nuovi prodotti all'array esistente
        if (data.length < this.pageSize) {
          this.allLoaded = true; // Se la lunghezza dei dati è inferiore alla pageSize, significa che non ci sono più prodotti da caricare
        }
        this.products = [...this.products, ...data];
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  //TODO: CATEGORIE
  categorySearch: string = '';

  ReadCategories() {
    this.productsService.getCategories().subscribe({
      next: (data: any[]) => {
        //! console.log(data);
        this.categories = data;
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
      }
    });
  }

  SearchByCategory(categories: number[]) {
    this.products = [];// svuota la lista dei prodotti visualizzati
    this.allLoaded = false;
    this.selectedCategories = categories;// salva le categorie selezionate
    this.productsService.GetProductByCategory(categories).subscribe({
      next: (data: any[]) => {
        this.products = data;// assegna i prodotti ricevuti alla lista visualizzata
      },
      error: (error) => {
        console.error('Error fetching products by category:', error);
      }
    });
  }

  // onCategorySearch(event: Event) {
  //   event.preventDefault();
  //   const found = this.categories.find(cat => cat.name.toLowerCase() === this.categorySearch.toLowerCase());
  //   if (found) {
  //     this.SearchByCategory(found.productCategoryId); // questo metodo accetta un array di ID, quindi passiamo un array con un solo ID
  //   } else {
  //     alert('Categoria non trovata');
  //   }
  // }

  // Metodo chiamato quando cambia lo stato dei checkbox delle categorie
  onCategoryCheckboxChange() {
    // Filtra solo le categorie con checkbox selezionata e raccoglie i rispettivi ID
    this.selectedCategories = this.categories
      .filter(cat => cat.checked)
      //       Scorre l’array this.categories (che contiene tutte le categorie ricevute dal backend).

      // Restituisce solo gli oggetti categoria in cui la proprietà checked è vera (true).

      // checked rappresenta se l’utente ha selezionato quella categoria con un checkbox.
      // Filtra solo le categorie che hanno il flag `checked` a true
      .map(cat => cat.productCategoryId);
    if (this.selectedCategories.length === 0) {
      this.products = []; // azzero l'array dei prodotti se non ci sono categorie selezionate
      this.ReadProducts();
    } else {
      // Se ci sono categorie selezionate, esegue la ricerca filtrata
      this.SearchByCategory(this.selectedCategories);
    }
  }

  // TODO: ORDINE PER PREZZO
  OrderByPrice(order: 'asc' | 'desc') {
    this.page = 1;
    this.products = [];
    this.allLoaded = false;
    this.order = order;
    this.loadOrderedProducts();
  }

  loadOrderedProducts() {
    this.productsService.GetProductsOrderedByPrice(this.page, this.pageSize, this.order!).subscribe({
      next: (data: any[]) => {
        this.products = [...this.products, ...data];
        if (data.length < this.pageSize) {
          this.allLoaded = true;
        }
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }


  // TODO: ORDINE PER NUOVI ARRIVI
  OrderByNewest() {
    this.page = 1;
    this.products = [];
    this.allLoaded = false;
    this.order = 'desc';
    this.productsService.GetProductsByNewest(this.page, this.pageSize, this.order).subscribe({
      next: (data: any[]) => {
        this.products = [...data];
        if (data.length < this.pageSize) {
          this.allLoaded = true;
        }
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  showMore() {
    if (!this.allLoaded) {
      this.page++;
      if (this.order === 'asc' || this.order === 'desc') {
        this.loadOrderedProducts();
      } else {
        this.ReadProducts();
      }
    }
  }

  ReoladProductsPage() {
    //reset delle variabili
    this.selectedCategories = [];
    this.categorySearch = '';
    this.order = null;
    this.page = 1;
    this.allLoaded = false;

    // reset delle categorie
    this.categories.forEach(cat => cat.checked = false);

    // ricarica i prodotti
    this.products = [];
    this.ReadProducts();
  }

  ngOnInit() {
    // Chiamata al metodo per leggere i prodotti
    this.ReadProducts();
    this.ReadCategories();
    this.cartService.cartProductId$.subscribe(id => {
      this.productId = id;
    });
  }

  // aggiunta del prodotto al carrello
  addToCart(productId: number): void {
    const itemToAdd: addCartItem = {
      productId: productId,
      quantity: 1
    };

    this.cartService.AddCartItem(itemToAdd).subscribe({
      next: () => {
      },
    });
  }

  isOnCart(productId: number): boolean {
    return this.productId.includes(productId);
  }
}