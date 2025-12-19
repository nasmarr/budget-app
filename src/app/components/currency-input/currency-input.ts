import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatFormField } from '@angular/material/input';
import { NgxCurrencyDirective } from 'ngx-currency';

@Component({
  selector: 'app-currency-input',
  imports: [NgxCurrencyDirective, MatInput, MatFormField, FormsModule],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInput),
      multi: true
    }
  ]
})
export class CurrencyInput implements ControlValueAccessor {
  value: number | null = null;
  isDisabled = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Called by Angular to set the value programmatically
  writeValue(value: number | null): void {
    this.value = value;
  }

  // Called by Angular to register the onChange callback
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  // Called by Angular to register the onTouched callback
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Called by Angular to disable/enable the control
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Called when the input value changes
  onValueChange(value: number | null): void {
    this.value = value;
    this.onChange(value);
  }

  // Called when the input loses focus
  onBlur(): void {
    this.onTouched();
  }
}
