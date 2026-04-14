import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-go-back-button',
  imports: [],
  templateUrl: './go-back-button.component.html',
  styleUrl: './go-back-button.component.css',
})
export class GoBackButtonComponent {
  constructor(private _location: Location) {}

  backClicked() {
    this._location.back();
  }
}
