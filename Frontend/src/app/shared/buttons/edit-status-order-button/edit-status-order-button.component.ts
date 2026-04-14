import { Component, EventEmitter, input, Output } from '@angular/core';
import { OrdersService } from '../../../services/orders.service';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize, tap } from 'rxjs';
declare var bootstrap: any;

@Component({
  selector: 'app-edit-status-order-button',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-status-order-button.component.html',
  styleUrl: './edit-status-order-button.component.css',
})
export class EditStatusOrderButtonComponent {
  statusForm = new FormGroup({
    statusCode: new FormControl<number>(0, {
      validators: [Validators.required],
    }),
  });

  @Output() statusUpdated = new EventEmitter<void>();

  orderId = input.required<number>();
  currentStatus = input.required<number>();

  allStatus = [
    { value: 1, label: 'In elaborazione' },
    { value: 2, label: 'Approvato' },
    { value: 3, label: 'In preparazione' },
    { value: 4, label: 'Rifiutato' },
    { value: 5, label: 'Spedito' },
    { value: 6, label: 'Cancellato' },
  ];

  availableStatus: { value: number; label: string }[] = [];

  constructor(private ordSvc: OrdersService) {}

  ngOnInit() {
    this.availableStatus = this.showAvailableStatus(this.currentStatus());
    console.log(this.availableStatus);
  }

  ngOnChanges() {
    this.availableStatus = this.showAvailableStatus(this.currentStatus());
  }

  UpdateStatus() {
    if (this.statusForm.invalid) {
      alert('Seleziona uno status');
      return;
    }

    this.ordSvc
      .UpdateStatus(this.orderId(), Number(this.statusForm.value.statusCode!))
      .pipe(
        tap(() => this.statusUpdated.emit()),
        finalize(() => this.CloseModal())
      )
      .subscribe({
        next: (res) => console.log(res),
        error: (err) => console.error(err),
      });
  }

  CloseModal() {
    const modalElement = document.getElementById('statusModal');

    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);

      modalInstance.hide();
    }
  }

  showAvailableStatus(statusValue: number) {
    console.log(statusValue);
    return this.allStatus.filter((status) => status.value > statusValue);
  }
}
