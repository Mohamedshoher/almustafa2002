
export enum DebtType {
  CASH = 'CASH',
  GOLD = 'GOLD'
}

export type RecordType = 'PAYMENT' | 'INCREASE';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: RecordType;
  note?: string;
  relatedId?: string; // لربط السجل بقسط معين أو عملية معينة
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number; // المبلغ الأصلي المطلوب للقسط
  paidAmount: number; // المبلغ الذي تم دفعه فعلياً
  paid: boolean;
  paymentDate?: string;
}

export interface Debt {
  id: string;
  amountInEGP: number;
  type: DebtType;
  goldPriceAtRegistration?: number;
  goldGrams?: number;
  monthsCount: number;
  startDate: string;
  installments: Installment[];
  history: PaymentRecord[]; // سجل كل عملية دفع أو زيادة تمت
  images: string[]; // Base64 strings
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  debts: Debt[];
  isArchived?: boolean; // حقل جديد للأرشفة
}

export interface AppState {
  customers: Customer[];
}
