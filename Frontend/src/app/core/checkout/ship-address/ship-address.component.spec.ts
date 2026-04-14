import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipAddressComponent } from './ship-address.component';

describe('ShipAddressComponent', () => {
  let component: ShipAddressComponent;
  let fixture: ComponentFixture<ShipAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipAddressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
