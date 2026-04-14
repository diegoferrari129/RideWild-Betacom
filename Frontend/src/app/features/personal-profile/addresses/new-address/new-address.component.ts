import { Component, inject, Input, signal, TemplateRef, WritableSignal } from '@angular/core';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Address, NewAddress } from '../../../../models/customers';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomersService } from '../../../../services/customers.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-new-address',
  standalone: true,
  imports: [NgbDatepickerModule, ReactiveFormsModule, NgIf],
  templateUrl: './new-address.component.html',
  styleUrl: './new-address.component.css'
})
export class NewAddressComponent {
  @Input() buttonClass: string = 'btn btn-lg btn-outline-primary';
  @Input() buttonName: string = 'Aggiungi Indirizzo';
  @Input() isEditMode: boolean = false;
  @Input() addressToEdit?: Address | null = null;

  private modalService = inject(NgbModal);
  private customerService = inject(CustomersService);
  closeResult: WritableSignal<string> = signal('');

  form = new FormGroup({
    addressType: new FormControl('', Validators.required),
    addressLine1: new FormControl('', Validators.required),
    addressLine2: new FormControl(''),
    city: new FormControl('', Validators.required),
    stateProvince: new FormControl('', Validators.required),
    countryRegion: new FormControl('', Validators.required),
    postalCode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{5}(-\d{4})?$/)
    ]),
  });

  private populateFormForEdit(): void {
    if (this.addressToEdit) {
      this.form.patchValue({
        addressType: this.addressToEdit.addressType,
        addressLine1: this.addressToEdit.addressLine1,
        addressLine2: this.addressToEdit.addressLine2 || '',
        city: this.addressToEdit.city,
        stateProvince: this.addressToEdit.stateProvince,
        countryRegion: this.addressToEdit.countryRegion,
        postalCode: this.addressToEdit.postalCode,
      });
    }
  }

  open(content: TemplateRef<any>) {
    if (this.isEditMode && this.addressToEdit) {
      this.populateFormForEdit();
    } else {
      this.form.reset();
    }

    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      scrollable: true
    }).result.then(
      (result) => {
        this.closeResult.set(`Closed with: ${result}`);
        this.form.reset();
      },
      (reason) => {
        this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
      }
    );
  }

  onSubmit(modal: any) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      //console.log('Form is invalid');
      return;
    }

    const addressData = {
      addressType: this.form.value.addressType!,
      addressLine1: this.form.value.addressLine1!,
      addressLine2: this.form.value.addressLine2 ?? null,
      city: this.form.value.city!,
      stateProvince: this.form.value.stateProvince!,
      countryRegion: this.form.value.countryRegion!,
      postalCode: this.form.value.postalCode!
    };

    if (this.isEditMode && this.addressToEdit) {
      const updatedAddress: Address = {
        ...addressData,
        addressId: this.addressToEdit.addressId
      };

      this.customerService.updateAddress(updatedAddress).subscribe({
        next: (response) => {
          this.customerService.updateAddressInState(response);
          //console.log('Address updated successfully');
          modal.close('updated');
        },
        error: (err) => {
          //console.error('Error updating address:', err);
        }
      });
    } else {
      const newAddress: NewAddress = addressData;

      this.customerService.addAddress(newAddress).subscribe({
        next: (response) => {
          this.customerService.addAddressToState(response);
          //console.log('Address added successfully');
          modal.close('added');
        },
        error: (err) => {
          //console.error('Error adding address:', err);
        }
      });
    }
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
}
