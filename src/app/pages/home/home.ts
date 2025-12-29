import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil, debounceTime } from 'rxjs/operators';
import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { CurrencyInput } from '../../components/currency-input/currency-input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransactionType } from '../../models';
import { CategoryService, TransactionService } from '../../services';

interface BudgetWarning {
  currentSpending: number;
  budgetLimit: number;
  percentUsed: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}


@Component({
  selector: 'app-home',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    CurrencyPipe,
    DecimalPipe,
    CurrencyInput,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})

export class Home implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  filteredCategories$!: Observable<string[]>;
  budgetWarning: BudgetWarning | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar
  ) {
    this.transactionForm = new FormGroup({
      amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      type: new FormControl<TransactionType>('expense', [Validators.required]),
      date: new FormControl<Date>(new Date(), [Validators.required]),
      category: new FormControl<string>('', [Validators.required]),
      description: new FormControl<string>(''),
    });
  }

  ngOnInit(): void {
    // Set up autocomplete filtering
    this.setupCategoryAutocomplete();

    // Update available categories when transaction type changes
    this.transactionForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.setupCategoryAutocomplete();
        this.budgetWarning = null; // Clear warning when type changes
      });

    // Check budget when category changes
    this.transactionForm.get('category')?.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((categoryName) => {
        this.checkBudgetWarning(categoryName);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const { amount, type, category, date, description } = formValue;

      // Auto-create category if it doesn't exist
      const categoryName = category.trim();
      const existingCategory = this.categoryService.findByName(categoryName, type);

      if (!existingCategory) {
        this.categoryService.createCategory(categoryName, type);
      }

      // Create the transaction
      const transaction = this.transactionService.createTransaction(
        amount,
        type,
        categoryName,
        date,
        description
      );

      console.log('Transaction saved:', transaction);

      // Show success message
      const typeText = type === 'income' ? 'Income' : 'Expense';
      this.snackBar.open(
        `${typeText} of $${amount.toFixed(2)} added to ${categoryName}`,
        'Close',
        { duration: 3000 }
      );

      // Reset form with smart defaults
      this.transactionForm.reset({
        type: 'expense',
        date: new Date(),
      });

      // Clear budget warning
      this.budgetWarning = null;
    }
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

    // Get categories from service synchronously
    this.categoryService.getCategoryNames(type)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cats => categories = cats);

    return categories.filter(category =>
      category.toLowerCase().includes(filterValue)
    );
  }

  private checkBudgetWarning(categoryName: string): void {
    if (!categoryName || categoryName.trim() === '') {
      this.budgetWarning = null;
      return;
    }

    const type = this.transactionForm.get('type')?.value as TransactionType;

    // Only check budget for expenses
    if (type !== 'expense') {
      this.budgetWarning = null;
      return;
    }

    const category = this.categoryService.findByName(categoryName.trim(), type);

    if (!category || !category.budgetLimit || category.budgetLimit <= 0) {
      this.budgetWarning = null;
      return;
    }

    // Get current month spending for this category
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.transactionService.getTransactionsByMonth(currentMonth, currentYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        const currentSpending = transactions
          .filter(t => t.type === 'expense' && t.category === categoryName.trim())
          .reduce((sum, t) => sum + t.amount, 0);

        const percentUsed = (currentSpending / category.budgetLimit!) * 100;

        if (percentUsed >= 80) {
          this.budgetWarning = {
            currentSpending,
            budgetLimit: category.budgetLimit!,
            percentUsed,
            isNearLimit: percentUsed >= 80 && percentUsed < 100,
            isOverLimit: percentUsed >= 100
          };
        } else {
          this.budgetWarning = null;
        }
      });
  }
}
