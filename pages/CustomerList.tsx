
import React, { useState, useMemo } from 'react';
import { Customer, DebtType } from '../types';
import { 
  Search, Phone, MessageSquare, Info, Archive, Trash2, RotateCcw, 
  UserCheck, Users, Wallet, Coins, AlertCircle, Filter, ChevronDown, 
  SortAsc, Calendar, ListFilter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRemainingBalance, formatCurrency, formatGrams } from '../utils/calculations';

interface CustomerListProps {
  customers: Customer[];
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

type StatusFilter = 'all' | 'overdue' | 'has_balance' | 'fully_paid';
type TypeFilter = 'all' | 'cash' | 'gold';
type SortOption = 'newest' | 'oldest' | 'name' | 'debt_desc';

const CustomerList: React.FC<CustomerListProps> = ({ customers, onDelete, onToggleArchive }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const hasOverdue = (customer: Customer) => {
    return customer.debts.some(debt => 
      debt.installments.some(inst => !inst.paid && new Date(inst.dueDate) < new Date())
    );
  };

  const getTotals = (customer: Customer) => {
    const cash = customer.debts
      .filter(d => d.type === DebtType.CASH)
      .reduce((sum, d) => sum + getRemainingBalance(d), 0);
    
    const gold = customer.debts
      .filter(d => d.type === DebtType.GOLD)
      .reduce((sum, d) => sum + getRemainingBalance(d), 0);
    
    return { cash, gold, total: cash + (gold * 4000) }; 
  };

  const filteredAndSortedCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        if (!matchesSearch) return false;

        const matchesTab = activeTab === 'archived' ? c.isArchived : !c.isArchived;
        if (!matchesTab) return false;

        if (statusFilter === 'overdue' && !hasOverdue(c)) return false;
        const { cash, gold } = getTotals(c);
        if (statusFilter === 'has_balance' && cash <= 0 && gold <= 0) return false;
        if (statusFilter === 'fully_paid' && (cash > 0 || gold > 0)) return false;

        if (typeFilter === 'cash' && !c.debts.some(d => d.type === DebtType.CASH)) return false;
        if (typeFilter === 'gold' && !c.debts.some(d => d.type === DebtType.GOLD)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        if (sortBy === 'debt_desc') return getTotals(b).total - getTotals(a).total;
        return 0;
      });
  }, [customers, searchTerm, activeTab, statusFilter, typeFilter, sortBy]);

  const getWhatsAppNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 px-1">
        <h1 className="text-2xl font-black text-slate-800">قائمة العملاء</h1>
        
        <div className="flex flex-col gap-2">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              className="w-full pr-10 pl-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 transition-all font-black text-xs ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'}`}
          >
            <Filter size={16} />
            <span>تصفية ({filteredAndSortedCustomers.length})</span>
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 px-1">الحالة</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full p-2 border-2 border-slate-100 rounded-lg text-xs font-black bg-slate-50"
            >
              <option value="all">الكل</option>
              <option value="overdue">المتأخرون</option>
              <option value="has_balance">عليهم ديون</option>
              <option value="fully_paid">مسددون</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 px-1">الترتيب</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full p-2 border-2 border-slate-100 rounded-lg text-xs font-black bg-slate-50"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="name">الاسم</option>
              <option value="debt_desc">الأعلى ديوناً</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabs - أكثر ملاءمة للموبايل */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
            activeTab === 'active' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          نشط ({customers.filter(c => !c.isArchived).length})
        </button>
        <button 
          onClick={() => setActiveTab('archived')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
            activeTab === 'archived' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          أرشيف ({customers.filter(c => !!c.isArchived).length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAndSortedCustomers.map(customer => {
          const { cash: totalCashRemaining, gold: totalGoldRemaining } = getTotals(customer);
          const isOverdue = hasOverdue(customer);

          return (
            <div key={customer.id} className={`bg-white p-4 rounded-2xl border-2 ${isOverdue ? 'border-red-200' : 'border-slate-100'} flex flex-col`}>
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-black text-slate-800 truncate">{customer.name}</h3>
                    {isOverdue && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">متأخر</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{customer.phone}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => onToggleArchive(customer.id)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100"><Archive size={14} /></button>
                  <Link to={`/customer/${customer.id}`} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Info size={14} /></Link>
                </div>
              </div>

              <div className={`p-3 rounded-xl space-y-2 mb-3 ${isOverdue ? 'bg-red-50/50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span className="text-slate-500 uppercase">متبقي نقدي</span>
                  <span className="text-indigo-700">{formatCurrency(totalCashRemaining)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span className="text-slate-500 uppercase">متبقي ذهب</span>
                  <span className="text-amber-700">{formatGrams(totalGoldRemaining)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto">
                <a href={`tel:${customer.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] shadow-sm"><Phone size={12} /> اتصال</a>
                <a href={`https://wa.me/${getWhatsAppNumber(customer.phone)}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg font-black text-[10px] shadow-sm"><MessageSquare size={12} /> واتساب</a>
              </div>
            </div>
          );
        })}
        
        {filteredAndSortedCustomers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black text-sm">لا يوجد عملاء مطابقين</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
