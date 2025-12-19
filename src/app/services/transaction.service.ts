import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Transaction, TransactionType } from '../models';

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly STORAGE_KEY = 'budget-app-transactions';
  private transactionsSubject: BehaviorSubject<Transaction[]>;
  public transactions$: Observable<Transaction[]>;

  constructor() {
    const initialTransactions = this.loadFromStorage();
    this.transactionsSubject = new BehaviorSubject<Transaction[]>(initialTransactions);
    this.transactions$ = this.transactionsSubject.asObservable();
  }

  /**
   * Get all transactions as an observable
   */
  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  /**
   * Get transactions filtered by type
   */
  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => t.type === type))
    );
  }

  /**
   * Get transactions for a specific category
   */
  getTransactionsByCategory(category: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t =>
        t.category.toLowerCase() === category.toLowerCase()
      ))
    );
  }

  /**
   * Get transactions within a date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      }))
    );
  }

  /**
   * Get transactions for a specific month/year
   */
  getTransactionsByMonth(month: number, year: number): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
      }))
    );
  }

  /**
   * Get transactions for a specific year
   */
  getTransactionsByYear(year: number): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === year;
      }))
    );
  }

  /**
   * Create a new transaction
   */
  createTransaction(
    amount: number,
    type: TransactionType,
    category: string,
    date: Date,
    description?: string
  ): Transaction {
    const newTransaction: Transaction = {
      id: this.generateId(),
      amount,
      type,
      category,
      date,
      description,
      createdAt: new Date()
    };

    const updatedTransactions = [...this.transactionsSubject.value, newTransaction];
    this.updateTransactions(updatedTransactions);
    return newTransaction;
  }

  /**
   * Update an existing transaction
   */
  updateTransaction(id: string, updates: Partial<Transaction>): void {
    const transactions = this.transactionsSubject.value;
    const index = transactions.findIndex(t => t.id === id);

    if (index !== -1) {
      const updatedTransaction = { ...transactions[index], ...updates };
      const updatedTransactions = [
        ...transactions.slice(0, index),
        updatedTransaction,
        ...transactions.slice(index + 1)
      ];
      this.updateTransactions(updatedTransactions);
    }
  }

  /**
   * Delete a transaction
   */
  deleteTransaction(id: string): void {
    const updatedTransactions = this.transactionsSubject.value.filter(t => t.id !== id);
    this.updateTransactions(updatedTransactions);
  }

  /**
   * Get summary statistics for all transactions
   */
  getSummary(): Observable<TransactionSummary> {
    return this.transactions$.pipe(
      map(transactions => this.calculateSummary(transactions))
    );
  }

  /**
   * Get summary statistics for a date range
   */
  getSummaryByDateRange(startDate: Date, endDate: Date): Observable<TransactionSummary> {
    return this.getTransactionsByDateRange(startDate, endDate).pipe(
      map(transactions => this.calculateSummary(transactions))
    );
  }

  /**
   * Get total spending by category (for expenses only)
   */
  getExpensesByCategory(): Observable<CategoryTotal[]> {
    return this.getTransactionsByType('expense').pipe(
      map(transactions => {
        const categoryMap = new Map<string, { total: number; count: number }>();

        transactions.forEach(t => {
          const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
          categoryMap.set(t.category, {
            total: existing.total + t.amount,
            count: existing.count + 1
          });
        });

        return Array.from(categoryMap.entries())
          .map(([category, { total, count }]) => ({ category, total, count }))
          .sort((a, b) => b.total - a.total);
      })
    );
  }

  /**
   * Get total income by category
   */
  getIncomeByCategory(): Observable<CategoryTotal[]> {
    return this.getTransactionsByType('income').pipe(
      map(transactions => {
        const categoryMap = new Map<string, { total: number; count: number }>();

        transactions.forEach(t => {
          const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
          categoryMap.set(t.category, {
            total: existing.total + t.amount,
            count: existing.count + 1
          });
        });

        return Array.from(categoryMap.entries())
          .map(([category, { total, count }]) => ({ category, total, count }))
          .sort((a, b) => b.total - a.total);
      })
    );
  }

  /**
   * Clear all transactions (useful for testing)
   */
  clearAll(): void {
    this.updateTransactions([]);
  }

  /**
   * Debug helper to view storage contents
   */
  debugStorage(): void {
    console.group('TransactionService Debug');
    console.log('Current transactions:', this.transactionsSubject.value);
    console.log('Transaction count:', this.transactionsSubject.value.length);
    console.log('localStorage key:', this.STORAGE_KEY);
    console.log('localStorage raw:', localStorage.getItem(this.STORAGE_KEY));
    console.log('Summary:', this.calculateSummary(this.transactionsSubject.value));
    console.groupEnd();
  }

  /**
   * Calculate summary statistics from transactions
   */
  private calculateSummary(transactions: Transaction[]): TransactionSummary {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount: transactions.length
    };
  }

  /**
   * Load transactions from localStorage
   */
  private loadFromStorage(): Transaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((t: any) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt)
      }));
    } catch (error) {
      console.error('Error loading transactions from storage:', error);
      return [];
    }
  }

  /**
   * Save transactions to localStorage
   */
  private saveToStorage(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions to storage:', error);
    }
  }

  /**
   * Update transactions and persist to storage
   */
  private updateTransactions(transactions: Transaction[]): void {
    // Sort by date (most recent first)
    const sorted = [...transactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    this.transactionsSubject.next(sorted);
    this.saveToStorage(sorted);
  }

  /**
   * Generate a unique ID for transactions
   */
  private generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
