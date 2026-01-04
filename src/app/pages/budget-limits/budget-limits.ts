import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Category, TransactionType } from '../../models';
import { CategoryService, TransactionService } from '../../services';
import { CurrencyInput } from '../../components/currency-input/currency-input';

interface CategoryWithSpending extends Category {
  currentMonthSpending: number;
  percentUsed: number;
}

@Component({
  selector: 'app-budget-limits',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDividerModule,
    CurrencyInput
  ],
  templateUrl: './budget-limits.html',
  styleUrl: './budget-limits.scss',
})
export class BudgetLimits implements OnInit {
  expenseCategories$!: Observable<CategoryWithSpending[]>;
  incomeCategories$!: Observable<CategoryWithSpending[]>;

  editingCategoryId: string | null = null;
  budgetLimitControls: Map<string, FormControl<number | null>> = new Map();

  constructor(
    private categoryService: CategoryService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get expense categories with spending data
    this.expenseCategories$ = combineLatest([
      this.categoryService.getCategoriesByType('expense'),
      this.transactionService.getTransactionsByMonth(currentMonth, currentYear)
    ]).pipe(
      map(([categories, transactions]) => {
        return categories.map(category => {
          const spending = transactions
            .filter(t => t.type === 'expense' && t.category === category.name)
            .reduce((sum, t) => sum + t.amount, 0);

          const percentUsed = category.budgetLimit && category.budgetLimit > 0
            ? (spending / category.budgetLimit) * 100
            : 0;

          return {
            ...category,
            currentMonthSpending: spending,
            percentUsed
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      })
    );

    // Get income categories with income data
    this.incomeCategories$ = combineLatest([
      this.categoryService.getCategoriesByType('income'),
      this.transactionService.getTransactionsByMonth(currentMonth, currentYear)
    ]).pipe(
      map(([categories, transactions]) => {
        return categories.map(category => {
          const income = transactions
            .filter(t => t.type === 'income' && t.category === category.name)
            .reduce((sum, t) => sum + t.amount, 0);

          const percentUsed = category.budgetLimit && category.budgetLimit > 0
            ? (income / category.budgetLimit) * 100
            : 0;

          return {
            ...category,
            currentMonthSpending: income,
            percentUsed
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  startEditing(category: CategoryWithSpending): void {
    this.editingCategoryId = category.id;

    if (!this.budgetLimitControls.has(category.id)) {
      this.budgetLimitControls.set(
        category.id,
        new FormControl<number | null>(category.budgetLimit ?? null)
      );
    } else {
      this.budgetLimitControls.get(category.id)?.setValue(category.budgetLimit ?? null);
    }
  }

  saveBudgetLimit(category: CategoryWithSpending): void {
    const control = this.budgetLimitControls.get(category.id);
    if (control) {
      const budgetLimit = control.value;
      this.categoryService.updateCategory(category.id, { budgetLimit: budgetLimit ?? undefined });
      this.editingCategoryId = null;
    }
  }

  cancelEditing(): void {
    this.editingCategoryId = null;
  }

  isEditing(categoryId: string): boolean {
    return this.editingCategoryId === categoryId;
  }

  getBudgetLimitControl(categoryId: string): FormControl<number | null> {
    if (!this.budgetLimitControls.has(categoryId)) {
      this.budgetLimitControls.set(categoryId, new FormControl<number | null>(null));
    }
    return this.budgetLimitControls.get(categoryId)!;
  }

  getStatusClass(category: CategoryWithSpending): string {
    if (!category.budgetLimit) {
      return '';
    }

    if (category.percentUsed >= 100) {
      return 'over-budget';
    } else if (category.percentUsed >= 80) {
      return 'near-budget';
    }
    return 'under-budget';
  }
}
