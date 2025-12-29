import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TransactionService, TransactionSummary, CategoryService } from '../../services';
import { DateFilter, DateFilterValue } from '../../components/date-filter/date-filter';

interface ChartData {
  name: string;
  value: number;
}

interface BudgetComparisonData {
  name: string;
  series: { name: string; value: number }[];
}

@Component({
  selector: 'app-category-breakdown',
  imports: [AsyncPipe, CurrencyPipe, MatCardModule, MatIconModule, NgxChartsModule, DateFilter],
  templateUrl: './category-breakdown.html',
  styleUrl: './category-breakdown.scss',
})
export class CategoryBreakdown implements OnInit {
  summary$!: Observable<TransactionSummary>;
  expensesByCategory$!: Observable<ChartData[]>;
  incomeByCategory$!: Observable<ChartData[]>;
  budgetComparison$!: Observable<BudgetComparisonData[]>;

  currentFilter: DateFilterValue = { period: 'month' };
  showBudgetComparison = true;

  // Chart configuration - use built-in color scheme
  colorScheme: any = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50']
  };

  budgetColorScheme: any = {
    name: 'budget',
    selectable: true,
    group: 'Ordinal',
    domain: ['#2196f3', '#4caf50'] // Blue for Actual, Green for Budget
  };

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadData({ period: 'month' });
  }

  onFilterChange(filter: DateFilterValue): void {
    this.currentFilter = filter;
    this.showBudgetComparison = filter.period === 'month';
    this.loadData(filter);
  }

  private loadData(filter: DateFilterValue): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let transactions$: Observable<any>;

    switch (filter.period) {
      case 'month':
        transactions$ = this.transactionService.getTransactionsByMonth(currentMonth, currentYear);
        break;
      case 'year':
        transactions$ = this.transactionService.getTransactionsByYear(currentYear);
        break;
      case 'custom':
        if (filter.startDate && filter.endDate) {
          transactions$ = this.transactionService.getTransactionsByDateRange(filter.startDate, filter.endDate);
        } else {
          transactions$ = this.transactionService.getTransactions();
        }
        break;
      case 'all':
      default:
        transactions$ = this.transactionService.getTransactions();
        break;
    }

    // Calculate summary based on filtered transactions
    this.summary$ = transactions$.pipe(
      map(transactions => {
        const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
        const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
        return {
          totalIncome,
          totalExpenses,
          netAmount: totalIncome - totalExpenses,
          transactionCount: transactions.length
        };
      })
    );

    // Calculate expenses by category
    this.expensesByCategory$ = transactions$.pipe(
      map(transactions => {
        const categoryMap = new Map<string, number>();
        transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        });
        return Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      })
    );

    // Calculate income by category
    this.incomeByCategory$ = transactions$.pipe(
      map(transactions => {
        const categoryMap = new Map<string, number>();
        transactions.filter((t: any) => t.type === 'income').forEach((t: any) => {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        });
        return Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      })
    );

    // Calculate budget vs. actual comparison (only for current month)
    if (filter.period === 'month') {
      this.budgetComparison$ = combineLatest([
        transactions$,
        this.categoryService.getCategories()
      ]).pipe(
        map(([transactions, categories]) => {
          // Get categories with budget limits
          const categoriesWithLimits = categories.filter(cat => cat.budgetLimit && cat.budgetLimit > 0);

          if (categoriesWithLimits.length === 0) {
            return [];
          }

          // Calculate actual spending per category
          const actualByCategory = new Map<string, number>();
          transactions.forEach((t: any) => {
            actualByCategory.set(t.category, (actualByCategory.get(t.category) || 0) + t.amount);
          });

          // Create comparison data
          return categoriesWithLimits
            .map(category => {
              const actual = actualByCategory.get(category.name) || 0;
              return {
                name: category.name,
                series: [
                  { name: 'Actual', value: actual },
                  { name: 'Budget', value: category.budgetLimit || 0 }
                ]
              };
            })
            .filter(item => item.series[1].value > 0) // Only show categories with budget set
            .sort((a, b) => a.name.localeCompare(b.name));
        })
      );
    }
  }
}
