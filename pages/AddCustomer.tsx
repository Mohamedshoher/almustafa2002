
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, DebtType, DebtImage } from '../types';
import { fetchCurrentGoldPrice } from '../services/goldService';
import { calculateInstallments, formatCurrency } from '../utils/calculations';
import { Camera, Save, Loader2, Coins, Wallet, ExternalLink, RefreshCw, Clock, Tag } from 'lucide-react';

const AddCustomer: React.FC<{ onAdd: (customer: Customer) => void }> = ({ onAdd }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [goldSource, setGoldSource] = useState<string | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const [isCached, setIsCached] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [debtLabel, setDebtLabel] = useState('الفاتورة الأولى');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<DebtType>(DebtType.CASH);
  const [months, setMonths] = useState<number>(12);
  const [images, setImages] = useState<string[]>([]);

  const amount = parseFloat(amountStr) || 0;

  const getPrice = async (force: boolean = false) => {
    setLoading(true);
    const data = await fetchCurrentGoldPrice(force);
    setGoldPrice(data.price);
    setGoldSource(data.sourceUrl);
    setLastUpdated(data.lastUpdated);
    setIsCached(data.isFromCache);
    setLoading(false);
  };

  useEffect(() => {
    if (type === DebtType.GOLD && !goldPrice) {
      getPrice();
    }
  }, [type, goldPrice]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmountStr(val);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length + images.length > 5) {
      alert("الحد الأقصى 5 صور فقط");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || amount <= 0) return;

    const goldGrams = type === DebtType.GOLD && goldPrice ? amount / goldPrice : undefined;
    const now = new Date().toISOString();

    const formattedImages: DebtImage[] = images.map(img => ({
      id: Math.random().toString(36).substr(2, 9),
      url: img,
      addedAt: now
    }));

    const newDebt = {
      id: Math.random().toString(36).substr(2, 9),
      label: debtLabel || 'الفاتورة الأولى',
      amountInEGP: amount,
      type,
      goldPriceAtRegistration: goldPrice || undefined,
      goldGrams,
      monthsCount: months,
      startDate: now,
      installments: calculateInstallments(amount, months, type, goldGrams),
      history: [],
      images: formattedImages
    };

    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      phone,
      createdAt: now,
      debts: [newDebt]
    };

    onAdd(newCustomer);
    navigate('/');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10">
      <header className="px-2">
        <h1 className="text-2xl font-black text-slate-800">إضافة عميل جديد</h1>
        <p className="text-slate-500 text-sm font-bold">تسجيل البيانات والمديونية الأولى</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-500 px-1 uppercase">اسم العميل</label>
            <input 
              required
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
              placeholder="مثال: محمد أحمد"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-500 px-1 uppercase">رقم الهاتف</label>
            <input 
              required
              inputMode="numeric"
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block font-black text-slate-800 text-sm mb-4 border-r-4 border-indigo-600 pr-2 uppercase">تفاصيل المديونية</label>
          
          <div className="space-y-1 mb-4">
            <label className="text-xs font-black text-slate-500 px-1 uppercase">اسم الفاتورة</label>
            <input 
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none text-sm font-bold"
              placeholder="مثال: الفاتورة الأولى"
              value={debtLabel}
              onChange={e => setDebtLabel(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType(DebtType.CASH)}
              className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                type === DebtType.CASH ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'
              }`}
            >
              <Wallet size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight">مبلغ نقدي</span>
            </button>
            <button
              type="button"
              onClick={() => setType(DebtType.GOLD)}
              className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                type === DebtType.GOLD ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-50 bg-slate-50 text-slate-400'
              }`}
            >
              <Coins size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight">جرام ذهب</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-500 px-1 uppercase tracking-tight">المبلغ الإجمالي (ج.م)</label>
            <div className="relative">
              <input 
                type="text"
                inputMode="decimal"
                required
                className="w-full p-4 border-2 border-slate-100 rounded-xl outline-none text-2xl font-black text-indigo-900 text-center"
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
              />
            </div>
            
            {type === DebtType.GOLD && goldPrice && (
              <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-800 flex justify-between items-center">
                <span>سعر الذهب: {formatCurrency(goldPrice)}</span>
                <span className="text-indigo-700">المجموع: {(amount / goldPrice).toFixed(2)} جرام</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-500 px-1">مدة التقسيط</label>
              <select 
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl outline-none bg-slate-50 text-sm font-bold"
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
              >
                {[3, 6, 9, 12, 18, 24].map(m => <option key={m} value={m}>{m} شهر</option>)}
              </select>
            </div>

            <div className="space-y-2">
               <label className="block text-xs font-black text-slate-500 px-1">الصور</label>
               <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-12 h-12 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-500 bg-slate-50">
                    <Camera size={16} />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <button 
          disabled={loading || amount <= 0}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-base shadow-lg active:scale-95 transition-all"
        >
          {loading ? <Loader2 className="animate-spin inline mr-2" size={20} /> : <Save className="inline mr-2" size={20} />}
          حفظ وبدء المتابعة
        </button>
      </form>
    </div>
  );
};

export default AddCustomer;
