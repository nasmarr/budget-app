import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { TransactionHistory } from './pages/transaction-history/transaction-history';
import { CategoryBreakdown } from './pages/category-breakdown/category-breakdown';
import { BudgetLimits } from './pages/budget-limits/budget-limits';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'history', component: TransactionHistory },
  { path: 'breakdown', component: CategoryBreakdown },
  { path: 'limits', component: BudgetLimits },
];
