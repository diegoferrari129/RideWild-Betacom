import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipMethodComponent } from './ship-method.component';

describe('ShipMethodComponent', () => {
  let component: ShipMethodComponent;
  let fixture: ComponentFixture<ShipMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipMethodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShipMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
