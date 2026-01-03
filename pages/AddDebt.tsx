
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Customer, DebtType, Debt, DebtImage } from '../types';
import { fetchCurrentGoldPrice } from '../services/goldService';
import { calculateInstallments, formatCurrency } from '../utils/calculations';
import { Camera, Save, Loader2, Coins, Wallet, ExternalLink, RefreshCw, Clock, ArrowRight, User, Tag } from 'lucide-react';

interface AddDebtProps {
  customers: Customer[];
  onAddDebt: (customerId: string, newDebt: Debt) => void;
}

const AddDebt: React.FC<AddDebtProps> = ({ customers, onAddDebt }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find(c => c.id === id);
  
  const [loading, setLoading] = useState(false);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [goldSource, setGoldSource] = useState<string | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const [isCached, setIsCached] = useState(false);
  
  // Form State
  const [debtLabel, setDebtLabel] = useState('فاتورة جديدة');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<DebtType>(DebtType.CASH);
  const [months, setMonths] = useState<number>(12);
  const [images, setImages] = useState<string[]>([]);

  const amount = parseFloat(amountStr) || 0;

  useEffect(() => {
    if (!customer) navigate('/customers');
  }, [customer, navigate]);

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
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || amount <= 0) return;

    const goldGrams = type === DebtType.GOLD && goldPrice ? amount / goldPrice : undefined;
    const now = new Date().toISOString();

    const formattedImages: DebtImage[] = images.map(img => ({
      id: Math.random().toString(36).substr(2, 9),
      url: img,
      addedAt: now
    }));

    const newDebt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      label: debtLabel || 'فاتورة جديدة',
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

    onAddDebt(customer.id, newDebt);
    navigate(`/customer/${customer.id}`);
  };

  if (!customer) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link to={`/customer/${customer.id}`} className="p-3 bg-white rounded-full border shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowRight size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">إضافة فاتورة جديدة</h1>
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <User size={16} />
            <span>للعميل: {customer.name}</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div>
          <label className="block font-black text-slate-800 text-xl mb-4 border-r-4 border-indigo-600 pr-3">تفاصيل المديونية الجديدة</label>
          
          <div className="space-y-2 mb-6">
            <label className="flex items-center gap-2 font-bold text-slate-700">
              <Tag size={18} className="text-indigo-500" />
              اسم الفاتورة (للمتابعة)
            </label>
            <input 
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 font-bold transition-all"
              placeholder="مثال: فاتورة جديدة، طقم ذهب، إلخ"
              value={debtLabel}
              onChange={e => setDebtLabel(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              type="button"
              onClick={() => setType(DebtType.CASH)}
              className={`flex-1 p-5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all duration-300 font-black ${
                type === DebtType.CASH 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-[1.02]' 
                : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-400'
              }`}
            >
              <Wallet size={24} />
              <span>مبلغ نقدي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType(DebtType.GOLD);
                if (!goldPrice) getPrice();
              }}
              className={`flex-1 p-5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all duration-300 font-black ${
                type === DebtType.GOLD 
                ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md transform scale-[1.02]' 
                : 'border-slate-100 bg-white text-slate-400 hover:border-amber-200 hover:text-amber-400'
              }`}
            >
              <Coins size={24} />
              <span>جرام ذهب ع24</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">المبلغ الإجمالي للفاتورة (بالجنيه)</label>
            <div className="relative">
              <input 
                type="text"
                inputMode="decimal"
                required
                className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-3xl font-black bg-white text-indigo-900 placeholder:text-slate-200 text-center shadow-inner"
                placeholder="0.00"
                value={amountStr}
                onChange={handleAmountChange}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">ج.م</span>
            </div>
            
            {type === DebtType.GOLD && (
              <div className="mt-4 p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-amber-800 font-black">
                    <Coins size={20} className="text-amber-600" />
                    <span>سعر اليوم المعتمد (عيار 24)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCached && !loading && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 font-black">
                        <Clock size={12} /> محدث
                      </span>
                    )}
                    <button 
                      type="button" 
                      onClick={() => getPrice(true)}
                      className="p-2 hover:bg-amber-200 rounded-full transition-colors text-amber-600 bg-white shadow-sm border border-amber-100"
                      title="تحديث السعر يدوياً"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center p-4 gap-3 text-amber-600 font-bold">
                    <Loader2 className="animate-spin" size={20} />
                    <span>جاري تحديث السعر...</span>
                  </div>
                ) : goldPrice ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-3xl font-black text-amber-700">{formatCurrency(goldPrice)}</p>
                      <div className="text-left">
                         <p className="text-[10px] text-amber-500 font-bold">آخر تحديث: {lastUpdated}</p>
                         {goldSource && (
                          <a href={goldSource} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 hover:underline justify-end">
                            المصدر <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-amber-200 flex justify-between items-center">
                      <p className="text-base text-amber-900 font-bold">
                        إجمالي الذهب: <span className="font-black text-indigo-700 text-xl">{(amount / goldPrice).toFixed(2)} جرام</span>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">مدة التقسيط للفاتورة</label>
              <select 
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 font-bold appearance-none cursor-pointer"
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
              >
                {[3, 6, 9, 12, 18, 24, 36, 48].map(m => (
                  <option key={m} value={m}>{m} شهر</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
               <label className="block font-bold text-slate-700">صور المرفقات (حد أقصى 5)</label>
               <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-indigo-100 group shadow-sm">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px]"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-400 hover:text-indigo-500 bg-slate-50">
                    <Camera size={20} />
                    <span className="text-[8px] mt-1 font-black">إضافة</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <button 
          disabled={loading || (type === DebtType.GOLD && !goldPrice) || amount <= 0}
          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-[0.98] mt-4"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          حفظ الفاتورة الجديدة
        </button>
      </form>
    </div>
  );
};

export default AddDebt;
