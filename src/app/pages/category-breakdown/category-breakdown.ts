import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TransactionService, TransactionSummary } from '../../services';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-category-breakdown',
  imports: [AsyncPipe, CurrencyPipe, MatCardModule, MatIconModule, NgxChartsModule],
  templateUrl: './category-breakdown.html',
  styleUrl: './category-breakdown.scss',
})
export class CategoryBreakdown implements OnInit {
  summary$!: Observable<TransactionSummary>;
  expensesByCategory$!: Observable<ChartData[]>;
  incomeByCategory$!: Observable<ChartData[]>;

  // Chart configuration - use built-in color scheme
  colorScheme: any = {
    name: 'custom',
    selectable: true,
    group: 'Ordinal',
    domain: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50']
  };

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.summary$ = this.transactionService.getSummary();

    this.expensesByCategory$ = this.transactionService.getExpensesByCategory().pipe(
      map(categories => categories.map(cat => ({
        name: cat.category,
        value: cat.total
      })))
    );

    this.incomeByCategory$ = this.transactionService.getIncomeByCategory().pipe(
      map(categories => categories.map(cat => ({
        name: cat.category,
        value: cat.total
      })))
    );
  }
}
