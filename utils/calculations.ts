
import { Debt, DebtType, Installment, PaymentRecord } from '../types';

export const calculateInstallments = (
  amount: number,
  months: number,
  type: DebtType,
  goldGrams?: number
): Installment[] => {
  const installments: Installment[] = [];
  const monthlyAmount = type === DebtType.GOLD && goldGrams 
    ? goldGrams / months 
    : amount / months;

  const today = new Date();

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(today.getMonth() + i);
    
    installments.push({
      id: Math.random().toString(36).substr(2, 9),
      dueDate: dueDate.toISOString().split('T')[0],
      amount: monthlyAmount,
      paidAmount: 0,
      paid: false
    });
  }
  return installments;
};

export const getRemainingBalance = (debt: Debt): number => {
  return debt.installments.reduce((sum, inst) => sum + (inst.amount - inst.paidAmount), 0);
};

export const getPaidAmount = (debt: Debt): number => {
  return debt.installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
};

// دالة مطورة لتوزيع مبلغ مدفوع (نقدي) على الأقساط (نقدية أو ذهب)
export const applyPaymentToDebt = (debt: Debt, paymentAmountEGP: number): Debt => {
  const now = new Date().toISOString();
  let valueToDeduct = paymentAmountEGP;
  let noteSuffix = "";

  // إذا كانت مديونية ذهب، نحول المبلغ المدفوع لجرامات بناءً على السعر المسجل
  if (debt.type === DebtType.GOLD && debt.goldPriceAtRegistration) {
    valueToDeduct = paymentAmountEGP / debt.goldPriceAtRegistration;
    noteSuffix = ` (ما يعادل ${valueToDeduct.toFixed(2)} جرام ذهب)`;
  }

  let remainingValue = valueToDeduct;
  
  const newInstallments = debt.installments.map(inst => {
    if (remainingValue <= 0 || inst.paid) return inst;

    const neededToComplete = inst.amount - inst.paidAmount;
    const paymentForThisInst = Math.min(remainingValue, neededToComplete);
    
    const newPaidAmount = inst.paidAmount + paymentForThisInst;
    remainingValue -= paymentForThisInst;

    return {
      ...inst,
      paidAmount: newPaidAmount,
      paid: newPaidAmount >= inst.amount - 0.0001, // سماحية بسيطة للأخطاء العشرية
      paymentDate: now
    };
  });

  const newHistoryRecord: PaymentRecord = {
    id: Math.random().toString(36).substr(2, 9),
    date: now,
    amount: debt.type === DebtType.GOLD ? valueToDeduct : paymentAmountEGP,
    type: 'PAYMENT',
    note: `سداد مبلغ نقدي قيمته ${paymentAmountEGP} ج.م${noteSuffix}`
  };

  return { 
    ...debt, 
    installments: newInstallments,
    history: [...(debt.history || []), newHistoryRecord]
  };
};

export const adjustDebtAmount = (debt: Debt, additionalEGP: number, reason: string): Debt => {
  const now = new Date().toISOString();
  let additionalValue = additionalEGP;

  if (debt.type === DebtType.GOLD && debt.goldPriceAtRegistration) {
    additionalValue = additionalEGP / debt.goldPriceAtRegistration;
  }

  const unpaidInstallments = debt.installments.filter(inst => !inst.paid);
  
  let newInstallments: Installment[];
  
  if (unpaidInstallments.length > 0) {
    const incrementPerMonth = additionalValue / unpaidInstallments.length;
    newInstallments = debt.installments.map(inst => {
      if (inst.paid) return inst;
      return {
        ...inst,
        amount: inst.amount + incrementPerMonth
      };
    });
  } else {
    const lastDate = new Date(debt.installments[debt.installments.length - 1].dueDate);
    lastDate.setMonth(lastDate.getMonth() + 1);
    
    newInstallments = [...debt.installments, {
      id: Math.random().toString(36).substr(2, 9),
      dueDate: lastDate.toISOString().split('T')[0],
      amount: additionalValue,
      paidAmount: 0,
      paid: false
    }];
  }

  const newHistoryRecord: PaymentRecord = {
    id: Math.random().toString(36).substr(2, 9),
    date: now,
    amount: additionalValue,
    type: 'INCREASE',
    note: reason || 'زيادة مديونية'
  };

  return {
    ...debt,
    amountInEGP: debt.amountInEGP + additionalEGP,
    goldGrams: debt.type === DebtType.GOLD && debt.goldGrams ? debt.goldGrams + additionalValue : debt.goldGrams,
    installments: newInstallments,
    history: [...(debt.history || []), newHistoryRecord]
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export const formatGrams = (grams: number) => {
  return `${grams.toFixed(2)} جرام`;
};
