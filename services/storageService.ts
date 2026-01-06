
import { Customer, Debt, DebtImage } from '../types';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

const GOLD_CACHE_KEY = 'gold_price_cache';
const LOCAL_IMAGES_PREFIX = 'local_debt_images_';

// دالة لحفظ الصور محلياً فقط
const saveImagesLocally = (debtId: string, images: DebtImage[]) => {
  if (images && images.length > 0) {
    localStorage.setItem(LOCAL_IMAGES_PREFIX + debtId, JSON.stringify(images));
  }
};

// دالة لجلب الصور من التخزين المحلي
const getLocalImages = (debtId: string): DebtImage[] => {
  const data = localStorage.getItem(LOCAL_IMAGES_PREFIX + debtId);
  return data ? JSON.parse(data) : [];
};

// دالة لحذف الصور المحلية
const deleteLocalImages = (debtId: string) => {
  localStorage.removeItem(LOCAL_IMAGES_PREFIX + debtId);
};

// مزامنة العملاء مع Firebase (بدون صور)
export const syncCustomerToCloud = async (customer: Customer) => {
  try {
    // 1. استخراج الصور وحفظها محلياً، ثم إفراغها من الكائن المتوجه للسحابة
    const cleanedDebts = customer.debts.map(debt => {
      saveImagesLocally(debt.id, debt.images);
      return { ...debt, images: [] }; // إرسال مصفوفة فارغة للسحابة
    });

    const cloudData = { ...customer, debts: cleanedDebts };
    await setDoc(doc(db, "customers", customer.id), cloudData);
  } catch (error) {
    console.error("Error syncing to cloud:", error);
  }
};

export const deleteCustomerFromCloud = async (customerId: string, debts: Debt[]) => {
  try {
    await deleteDoc(doc(db, "customers", customerId));
    // حذف الصور المحلية المرتبطة بمديونيات هذا العميل
    debts.forEach(d => deleteLocalImages(d.id));
  } catch (error) {
    console.error("Error deleting from cloud:", error);
  }
};

// الاستماع للبيانات ودمج الصور المحلية معها
export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => {
      const data = doc.data() as Customer;
      // دمج الصور المخزنة محلياً في كل مديونية
      const debtsWithLocalImages = data.debts.map(debt => ({
        ...debt,
        images: getLocalImages(debt.id)
      }));
      return { ...data, debts: debtsWithLocalImages };
    });
    callback(customers);
  });
};

export interface GoldCache {
  price: number;
  sourceUrl: string;
  timestamp: string; // ISO string
}

export const saveGoldCache = (cache: GoldCache) => {
  localStorage.setItem(GOLD_CACHE_KEY, JSON.stringify(cache));
};

export const loadGoldCache = (): GoldCache | null => {
  const data = localStorage.getItem(GOLD_CACHE_KEY);
  return data ? JSON.parse(data) : null;
};
