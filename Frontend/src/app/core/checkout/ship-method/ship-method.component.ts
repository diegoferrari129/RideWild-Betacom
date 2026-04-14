import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ship-method',
  imports: [ReactiveFormsModule],
  templateUrl: './ship-method.component.html',
  styleUrl: './ship-method.component.css'
})
export class ShipMethodComponent {
  @Input() form!: FormGroup;
  @Output() select = new EventEmitter<number>();


  onSelectShipMethod(value : string){
    const numberValue = parseInt(value)
    this.select.emit(numberValue);
  }

}
