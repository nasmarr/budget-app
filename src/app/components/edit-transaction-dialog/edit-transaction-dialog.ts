import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Transaction, TransactionType } from '../../models';
import { CategoryService } from '../../services';
import { CurrencyInput } from '../currency-input/currency-input';

@Component({
  selector: 'app-edit-transaction-dialog',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatIconModule,
    CurrencyInput
  ],
  templateUrl: './edit-transaction-dialog.html',
  styleUrl: './edit-transaction-dialog.scss',
})
export class EditTransactionDialog implements OnInit {
  transactionForm: FormGroup;
  filteredCategories$!: Observable<string[]>;

  constructor(
    public dialogRef: MatDialogRef<EditTransactionDialog>,
    @Inject(MAT_DIALOG_DATA) public transaction: Transaction,
    private categoryService: CategoryService
  ) {
    this.transactionForm = new FormGroup({
      amount: new FormControl<number | null>(transaction.amount, [Validators.required, Validators.min(0.01)]),
      type: new FormControl<TransactionType>(transaction.type, [Validators.required]),
      date: new FormControl<Date>(new Date(transaction.date), [Validators.required]),
      category: new FormControl<string>(transaction.category, [Validators.required]),
      description: new FormControl<string>(transaction.description || ''),
    });
  }

  ngOnInit(): void {
    this.setupCategoryAutocomplete();

    // Update available categories when transaction type changes
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.setupCategoryAutocomplete();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      this.dialogRef.close({
        action: 'save',
        data: {
          ...formValue,
          id: this.transaction.id,
          createdAt: this.transaction.createdAt
        }
      });
    }
  }

  onDelete(): void {
    this.dialogRef.close({
      action: 'delete',
      data: this.transaction
    });
  }

  clearCategory(): void {
    this.transactionForm.get('category')?.setValue('');
  }

  clearDescription(): void {
    this.transactionForm.get('description')?.setValue('');
  }

  private setupCategoryAutocomplete(): void {
    const currentType = this.transactionForm.get('type')?.value as TransactionType;

    this.filteredCategories$ = this.transactionForm.get('category')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategories(value || '', currentType))
    );
  }

  private filterCategories(value: string, type: TransactionType): string[] {
    const filterValue = value.toLowerCase();
    let categories: string[] = [];

    this.categoryService.getCategoryNames(type).subscribe(cats => categories = cats);

    return categories.filter(category =>
      category.toLowerCase().includes(filterValue)
    );
  }
}
