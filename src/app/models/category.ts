import { TransactionType } from './transaction';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  budgetLimit?: number;
  createdAt: Date;
}
