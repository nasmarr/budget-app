import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, TransactionType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'budget-app-categories';
  private categoriesSubject: BehaviorSubject<Category[]>;
  public categories$: Observable<Category[]>;

  constructor() {
    const initialCategories = this.loadFromStorage();
    this.categoriesSubject = new BehaviorSubject<Category[]>(initialCategories);
    this.categories$ = this.categoriesSubject.asObservable();
  }

  /**
   * Get all categories as an observable
   */
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  /**
   * Get categories filtered by transaction type
   */
  getCategoriesByType(type: TransactionType): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => categories.filter(cat => cat.type === type))
    );
  }

  /**
   * Get category names for autocomplete (filtered by type)
   */
  getCategoryNames(type: TransactionType): Observable<string[]> {
    return this.getCategoriesByType(type).pipe(
      map(categories => categories.map(cat => cat.name).sort())
    );
  }

  /**
   * Find a category by name and type
   */
  findByName(name: string, type: TransactionType): Category | undefined {
    return this.categoriesSubject.value.find(
      cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
    );
  }

  /**
   * Create a new category
   */
  createCategory(name: string, type: TransactionType, budgetLimit?: number): Category {
    const existing = this.findByName(name, type);
    if (existing) {
      return existing;
    }

    const newCategory: Category = {
      id: this.generateId(),
      name: name.trim(),
      type,
      budgetLimit,
      createdAt: new Date()
    };

    const updatedCategories = [...this.categoriesSubject.value, newCategory];
    this.updateCategories(updatedCategories);
    return newCategory;
  }

  /**
   * Update an existing category
   */
  updateCategory(id: string, updates: Partial<Category>): void {
    const categories = this.categoriesSubject.value;
    const index = categories.findIndex(cat => cat.id === id);

    if (index !== -1) {
      const updatedCategory = { ...categories[index], ...updates };
      const updatedCategories = [
        ...categories.slice(0, index),
        updatedCategory,
        ...categories.slice(index + 1)
      ];
      this.updateCategories(updatedCategories);
    }
  }

  /**
   * Delete a category
   */
  deleteCategory(id: string): void {
    const updatedCategories = this.categoriesSubject.value.filter(cat => cat.id !== id);
    this.updateCategories(updatedCategories);
  }

  /**
   * Clear all categories (useful for testing)
   */
  clearAll(): void {
    this.updateCategories([]);
  }

  /**
   * Debug helper to view storage contents
   */
  debugStorage(): void {
    console.group('CategoryService Debug');
    console.log('Current categories:', this.categoriesSubject.value);
    console.log('localStorage key:', this.STORAGE_KEY);
    console.log('localStorage raw:', localStorage.getItem(this.STORAGE_KEY));
    console.groupEnd();
  }

  /**
   * Load categories from localStorage
   */
  private loadFromStorage(): Category[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultCategories();
      }

      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt)
      }));
    } catch (error) {
      console.error('Error loading categories from storage:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Save categories to localStorage
   */
  private saveToStorage(categories: Category[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to storage:', error);
    }
  }

  /**
   * Update categories and persist to storage
   */
  private updateCategories(categories: Category[]): void {
    this.categoriesSubject.next(categories);
    this.saveToStorage(categories);
  }

  /**
   * Generate a unique ID for categories
   */
  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get default categories for first-time users
   */
  private getDefaultCategories(): Category[] {
    const now = new Date();
    return [
      { id: this.generateId(), name: 'Groceries', type: 'expense', createdAt: now },
      { id: this.generateId(), name: 'Rent', type: 'expense', createdAt: now },
      { id: this.generateId(), name: 'Transportation', type: 'expense', createdAt: now },
      { id: this.generateId(), name: 'Utilities', type: 'expense', createdAt: now },
      { id: this.generateId(), name: 'Entertainment', type: 'expense', createdAt: now },
      { id: this.generateId(), name: 'Salary', type: 'income', createdAt: now },
      { id: this.generateId(), name: 'Freelance', type: 'income', createdAt: now },
    ];
  }
}
