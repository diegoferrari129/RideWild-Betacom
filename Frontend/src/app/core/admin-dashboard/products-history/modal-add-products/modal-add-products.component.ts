// * Import necessari per il modulo ng-bootstrap
import { Component, inject, signal, TemplateRef, WritableSignal } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../../services/products.service';
import { CommonModule } from '@angular/common';
import { Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-modal-add-products',
  imports: [NgbDatepickerModule, FormsModule, CommonModule],
  templateUrl: './modal-add-products.component.html',
  styleUrl: './modal-add-products.component.css'
})
export class ModalAddProductsComponent {
  constructor(private productsService: ProductsService) { }

  @Output() productAdded = new EventEmitter<void>();

  private modalService = inject(NgbModal);
  closeResult: WritableSignal<string> = signal('');

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.closeResult.set(`Closed with: ${result}`);
      },
      (reason) => {
        this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
      },
    );
  }

  private getDismissReason(reason: any): string {
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }
  }


  // TODO: CATEGORIE
  categories: any[] = [];

  ReadCategories() {
    this.productsService.getCategories().subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.categories = data;
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
      }
    });
  }

  // TODO: MODELLI
  models: any[] = [];

  ReadModels() {
    this.productsService.getModels().subscribe({
      next: (data: any[]) => {
        console.log(data);
        this.models = data;
      },
      error: (error) => {
        console.error('Error fetching models:', error);
      }
    });
  }


  // TODO: AGGIUNTA PRODOTTO
  productName: string = '';
  productNumber: string = '';
  productPrice: number = 0;
  productListPrice: number = 0;
  productSize: string = '';
  productWeight: number = 0;
  selectedCategory: number = 0;
  selectedModel: number = 0;
  sellStartDate: Date = new Date();
  productImage: string | null = null;
  quantity: number = 1;

  // Metodo per gestire il file selezionato e convertirlo in binario
  onFileSelected(event: any) {
    // Ottiene il primo file selezionato dall'input di tipo file
    const file: File = event.target.files[0];
    if (!file) return; // Non fare nulla se non c'è file

    // Crea un oggetto FileReader per leggere il contenuto del file
    const reader = new FileReader();
    // Definisce cosa succede quando la lettura del file è completata
    reader.onload = () => {
      // Estrae la stringa base64 rimuovendo il prefisso "data:image/png;base64,"
      const base64String = (reader.result as string).split(',')[1];
      // Salva la stringa base64 (solo i dati) in una variabile del componente
      this.productImage = base64String;
    };
    // Avvia la lettura del file come Data URL (base64 con MIME type)
    reader.readAsDataURL(file);
  }


  AddProduct() {
    const newProduct = {
      name: this.productName,
      productNumber: this.productNumber,
      standardCost: this.productPrice,
      listPrice: this.productListPrice,
      size: this.productSize,
      weight: this.productWeight,
      productCategoryId: this.selectedCategory,
      productModelId: this.selectedModel,
      sellStartDate: this.sellStartDate ? this.sellStartDate.toISOString() : null,
      thumbNailPhoto: this.productImage || null,
      quantity: this.quantity
    };


    this.productsService.AddProduct(newProduct).subscribe({
      next: (response) => {
        //! console.log('Product added successfully:', response);
        this.productAdded.emit(); // Emit l'evento al padre
        this.modalService.dismissAll();
      },
      error: (error) => {
        console.error('Error adding product:', error);
      }
    });
  }



  ngOnInit() {
    this.ReadCategories();
    this.ReadModels();
  }
}
