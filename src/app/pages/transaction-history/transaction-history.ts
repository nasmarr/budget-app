import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '../../models';
import { TransactionService } from '../../services';

@Component({
  selector: 'app-transaction-history',
  imports: [AsyncPipe, DatePipe, CurrencyPipe, MatCardModule, MatIconModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.scss',
})
export class TransactionHistory implements OnInit {
  transactions$!: Observable<Transaction[]>;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.transactions$ = this.transactionService.getTransactions();
  }
}
