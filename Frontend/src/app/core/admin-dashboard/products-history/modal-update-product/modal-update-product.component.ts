// * Import necessari per il modulo ng-bootstrap
import { Component, inject, signal, TemplateRef, WritableSignal } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../../services/products.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal-update-product',
  imports: [NgbDatepickerModule, FormsModule, CommonModule],
  templateUrl: './modal-update-product.component.html',
  styleUrl: './modal-update-product.component.css'
})

export class ModalUpdateProductComponent {
  constructor(
    private productsService: ProductsService,
    private route: ActivatedRoute,
  ) { }

  @Output() productUpdated = new EventEmitter<void>();

  private modalService = inject(NgbModal);
  closeResult: WritableSignal<string> = signal('');

  open(content: TemplateRef<any>) {
    if (this.productId) {
      this.fetchProduct(this.productId);
    }
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

  @Input() productId!: number;

  // TODO: PRODOTTO
  product: any = null;
  error: string | null = null;

  // TODO: PREFILL PRODOTTO
  quantity: number | null = null;
  productName: string = '';
  productNumber: string = '';
  productPrice: number = 0;
  productListPrice: number = 0;
  productSize: string = '';
  productWeight: number = 0;
  selectedCategory: number = 0;
  selectedModel: number = 0;
  sellStartDate: Date = new Date();
  productImage: string = '';


  fetchProduct(id: number) {
    this.productsService.GetProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.productName = product.name;
        this.productNumber = product.productNumber;
        this.productPrice = product.standardCost;
        this.productListPrice = product.listPrice;
        this.productSize = product.size;
        this.productWeight = product.weight;
        this.selectedCategory = product.productCategoryId;
        this.selectedModel = product.productModelId;
        this.sellStartDate = product.sellStartDate ? new Date(product.sellStartDate) : new Date();
        this.productImage = product.thumbNailPhotoBase64;
        this.quantity = product.productStock.quantity;
        //! console.log("product", product);
      }
    });
  }

  // TODO: CATEGORIE
  categories: any[] = [];

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

  // TODO: MODELLI
  models: any[] = [];

  ReadModels() {
    this.productsService.getModels().subscribe({
      next: (data: any[]) => {
        //! console.log(data);
        this.models = data;
      },
      error: (error) => {
        console.error('Error fetching models:', error);
      }
    });
  }


  UpdateProducts(id: number, formValues: any) {
    const updatedProduct = {
      name: formValues.productName,
      productNumber: formValues.productNumber,
      standardCost: formValues.productPrice,
      listPrice: formValues.productListPrice,
      size: formValues.productSize,
      weight: formValues.productWeight,
      productCategoryId: formValues.productCategory,
      productModelId: formValues.selectedModel,
      sellStartDate: this.sellStartDate ? this.sellStartDate.toISOString() : null,
      thumbNailPhoto: formValues.productImage,
      quantity: formValues.quantity
    };
    this.productsService.UpdateProduct(id, updatedProduct).subscribe({
      next: (response) => {
        // console.log('Product updated successfully:', response);
        this.modalService.dismissAll();
        this.productUpdated.emit(); // Refresh the product details after update
      },
      error: (error) => {
        console.error('Error updating product:', error);
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchProduct(+id);
      }
      this.ReadCategories();
      this.ReadModels();
    });
  }
}




