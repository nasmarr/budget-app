import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyInput } from './currency-input';

describe('CurrencyInput', () => {
  let component: CurrencyInput;
  let fixture: ComponentFixture<CurrencyInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrencyInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
