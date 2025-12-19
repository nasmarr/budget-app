import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransactionType } from '../../models';


@Component({
  selector: 'app-home',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    CurrencyInput,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})

export class Home {
  transactionForm: FormGroup;

  constructor() {
    this.transactionForm = new FormGroup({
      amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      type: new FormControl<TransactionType>('expense', [Validators.required]),
      date: new FormControl<Date>(new Date(), [Validators.required]),
      category: new FormControl<string>('', [Validators.required]),
      description: new FormControl<string>(''),
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      console.log('Form submitted:', this.transactionForm.value);
      // TODO: Save transaction using TransactionService (next phase)
      this.transactionForm.reset({
        type: 'expense',
        date: new Date(),
      });
    }
  }
}
