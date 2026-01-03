
import { Customer } from '../types';

const STORAGE_KEY = 'debt_manager_data';
const GOLD_CACHE_KEY = 'gold_price_cache';

export interface GoldCache {
  price: number;
  sourceUrl: string;
  timestamp: string; // ISO string
}

export const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
};

export const loadCustomers = (): Customer[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGoldCache = (cache: GoldCache) => {
  localStorage.setItem(GOLD_CACHE_KEY, JSON.stringify(cache));
};

export const loadGoldCache = (): GoldCache | null => {
  const data = localStorage.getItem(GOLD_CACHE_KEY);
  return data ? JSON.parse(data) : null;
};
