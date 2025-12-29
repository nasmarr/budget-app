import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '../../models';
import { TransactionService } from '../../services';
import { DateFilter, DateFilterValue } from '../../components/date-filter/date-filter';

@Component({
  selector: 'app-transaction-history',
  imports: [AsyncPipe, DatePipe, CurrencyPipe, MatCardModule, MatIconModule, DateFilter],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.scss',
})
export class TransactionHistory implements OnInit {
  transactions$!: Observable<Transaction[]>;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions({ period: 'all' });
  }

  onFilterChange(filter: DateFilterValue): void {
    this.loadTransactions(filter);
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
  }
}
