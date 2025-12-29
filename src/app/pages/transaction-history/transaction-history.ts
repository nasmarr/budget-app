import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Transaction } from '../../models';
import { TransactionService } from '../../services';

type FilterPeriod = 'all' | 'month' | 'year';

@Component({
  selector: 'app-transaction-history',
  imports: [AsyncPipe, DatePipe, CurrencyPipe, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.scss',
})
export class TransactionHistory implements OnInit {
  transactions$!: Observable<Transaction[]>;
  selectedFilter: FilterPeriod = 'all';

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  setFilter(filter: FilterPeriod): void {
    this.selectedFilter = filter;
    this.loadTransactions();
  }

  private loadTransactions(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (this.selectedFilter) {
      case 'month':
        this.transactions$ = this.transactionService.getTransactionsByMonth(currentMonth, currentYear);
        break;
      case 'year':
        this.transactions$ = this.transactionService.getTransactionsByYear(currentYear);
        break;
      case 'all':
      default:
        this.transactions$ = this.transactionService.getTransactions();
        break;
    }
  }
}
