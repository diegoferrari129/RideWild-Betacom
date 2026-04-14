import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  Output,
} from '@angular/core';
import { OrdersService } from '../../../services/orders.service';
import { Router } from '@angular/router';
declare var bootstrap: any;

@Component({
  selector: 'app-delete-order-button',
  imports: [],
  templateUrl: './delete-order-button.component.html',
  styleUrl: './delete-order-button.component.css',
})
export class DeleteOrderButtonComponent {
  orderId = input.required<number>();

  @Output() delete = new EventEmitter();

  destroyRef = inject(DestroyRef);

  constructor(private ordSvc: OrdersService) {}

  DeleteOrder() {
    const subscription = this.ordSvc.DeleteOrder(this.orderId()).subscribe({
      next: (response: any) => {
        console.log(response);
        this.CloseModal();
        this.delete.emit();
      },
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe;
    });
  }

  CloseModal() {
    const modalElement = document.getElementById('deleteModal');

    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);

      modalInstance.hide();
    }
  }
}
