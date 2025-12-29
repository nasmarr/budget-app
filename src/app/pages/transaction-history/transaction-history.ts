import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Transaction, TransactionType } from '../../models';
import { TransactionService, CategoryService } from '../../services';
import { DateFilter, DateFilterValue } from '../../components/date-filter/date-filter';
import { EditTransactionDialog } from '../../components/edit-transaction-dialog/edit-transaction-dialog';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category';

@Component({
  selector: 'app-transaction-history',
  imports: [
    AsyncPipe,
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    DateFilter
  ],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.scss',
})
export class TransactionHistory implements OnInit {
  transactions$!: Observable<Transaction[]>;
  searchControl = new FormControl('');
  selectedType: 'all' | TransactionType = 'all';
  sortBy: SortOption = 'date-desc';

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTransactions({ period: 'month' });
  }

  onFilterChange(filter: DateFilterValue): void {
    this.loadTransactions(filter);
  }

  setTypeFilter(type: 'all' | TransactionType): void {
    this.selectedType = type;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private loadTransactions(filter: DateFilterValue): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (filter.period) {
      case 'month':
        this.transactions$ = this.transactionService.getTransactionsByMonth(currentMonth, currentYear);
        break;
      case 'year':
        this.transactions$ = this.transactionService.getTransactionsByYear(currentYear);
        break;
      case 'custom':
        if (filter.startDate && filter.endDate) {
          this.transactions$ = this.transactionService.getTransactionsByDateRange(filter.startDate, filter.endDate);
        }
        break;
      case 'all':
      default:
        this.transactions$ = this.transactionService.getTransactions();
        break;
    }

    this.applyFilters();
  }

  applyFilters(): void {
    this.transactions$ = this.transactions$.pipe(
      map(transactions => {
        let filtered = [...transactions];

        // Filter by type
        if (this.selectedType !== 'all') {
          filtered = filtered.filter(t => t.type === this.selectedType);
        }

        // Filter by search
        const searchTerm = this.searchControl.value?.toLowerCase() || '';
        if (searchTerm) {
          filtered = filtered.filter(t =>
            t.category.toLowerCase().includes(searchTerm) ||
            t.description?.toLowerCase().includes(searchTerm)
          );
        }

        // Sort
        filtered = this.sortTransactions(filtered);

        return filtered;
      })
    );
  }

  private sortTransactions(transactions: Transaction[]): Transaction[] {
    switch (this.sortBy) {
      case 'date-desc':
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'date-asc':
        return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount-desc':
        return transactions.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return transactions.sort((a, b) => a.amount - b.amount);
      case 'category':
        return transactions.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return transactions;
    }
  }

  openEditDialog(transaction: Transaction): void {
    const dialogRef = this.dialog.open(EditTransactionDialog, {
      width: '500px',
      maxWidth: '95vw',
      data: transaction
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'save') {
          // Auto-create category if it doesn't exist
          const categoryName = result.data.category.trim();
          const existingCategory = this.categoryService.findByName(categoryName, result.data.type);

          if (!existingCategory) {
            this.categoryService.createCategory(categoryName, result.data.type);
          }

          // Update the transaction
          this.transactionService.updateTransaction(result.data.id, result.data);

          this.snackBar.open('Transaction updated successfully', 'Close', { duration: 3000 });
        } else if (result.action === 'delete') {
          this.transactionService.deleteTransaction(result.data.id);
          this.snackBar.open('Transaction deleted', 'Close', { duration: 3000 });
        }
      }
    });
  }
}
