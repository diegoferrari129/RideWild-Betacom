import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillAddressComponent } from './bill-address.component';

describe('BillAddressComponent', () => {
  let component: BillAddressComponent;
  let fixture: ComponentFixture<BillAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillAddressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
