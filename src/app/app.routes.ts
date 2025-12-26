import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { TransactionHistory } from './pages/transaction-history/transaction-history';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'history', component: TransactionHistory },
];
