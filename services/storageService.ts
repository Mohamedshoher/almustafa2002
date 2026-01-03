
import { Customer, Debt } from '../types';

const CUSTOMERS_KEY = 'almustafa_customers_data';
const GOLD_CACHE_KEY = 'gold_price_cache';

export interface GoldCache {
  price: number;
  sourceUrl?: string;
  timestamp: string;
}

// نظام لإدارة المستمعين (Listeners) لمحاكاة التحديث التلقائي
let listeners: ((customers: Customer[]) => void)[] = [];

/**
 * دالة لجلب البيانات من التخزين المحلي
 */
const getStoredCustomers = (): Customer[] => {
  const data = localStorage.getItem(CUSTOMERS_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * دالة لحفظ البيانات وإشعار جميع المستمعين بالتغيير
 */
const saveAndNotify = (customers: Customer[]) => {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  listeners.forEach(listener => listener([...customers]));
};

/**
 * حفظ أو تحديث عميل
 */
export const syncCustomerToCloud = async (customer: Customer) => {
  const customers = getStoredCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  
  if (index > -1) {
    customers[index] = customer;
  } else {
    customers.push(customer);
  }
  
  saveAndNotify(customers);
  console.log("✅ تم حفظ البيانات محلياً بنجاح");
};

/**
 * حذف عميل
 */
export const deleteCustomerFromCloud = async (customerId: string) => {
  const customers = getStoredCustomers();
  const filtered = customers.filter(c => c.id !== customerId);
  saveAndNotify(filtered);
};

/**
 * الاشتراك في تغييرات البيانات (محاكاة onSnapshot)
 */
export const subscribeToCustomers = (
  onSuccess: (customers: Customer[]) => void,
  _onError: (error: any) => void
) => {
  listeners.push(onSuccess);
  // إرسال البيانات الحالية فوراً عند الاشتراك
  onSuccess(getStoredCustomers());
  
  // دالة لإلغاء الاشتراك
  return () => {
    listeners = listeners.filter(l => l !== onSuccess);
  };
};

/**
 * إدارة كاش الذهب
 */
export const saveGoldCache = (cache: GoldCache) => {
  localStorage.setItem(GOLD_CACHE_KEY, JSON.stringify(cache));
};

export const loadGoldCache = (): GoldCache | null => {
  const data = localStorage.getItem(GOLD_CACHE_KEY);
  return data ? JSON.parse(data) : null;
};
