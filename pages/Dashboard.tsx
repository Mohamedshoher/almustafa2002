
import React from 'react';
import { Customer, DebtType } from '../types';
import { formatCurrency, formatGrams, getRemainingBalance } from '../utils/calculations';
import { TrendingUp, Users, AlertCircle, Coins, BellRing, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadGoldCache } from '../services/storageService';

interface DashboardProps {
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  const activeCustomers = customers.filter(c => !c.isArchived);
  const goldPrice = loadGoldCache()?.price || 4000;

  const totalRemainingEGP = activeCustomers.reduce((acc, c) => 
    acc + c.debts.reduce((sum, d) => d.type === DebtType.CASH ? sum + getRemainingBalance(d) : sum, 0), 0
  );

  const totalRemainingGoldGrams = activeCustomers.reduce((acc, c) => 
    acc + c.debts.reduce((sum, d) => d.type === DebtType.GOLD ? sum + getRemainingBalance(d) : sum, 0), 0
  );

  const totalGlobalDebt = totalRemainingEGP + (totalRemainingGoldGrams * goldPrice);

  const overdueItems = activeCustomers.flatMap(customer => 
    customer.debts.flatMap(debt => 
      debt.installments
        .filter(inst => !inst.paid && new Date(inst.dueDate) < new Date())
        .map(inst => ({ customer, debt, inst }))
    )
  ).sort((a, b) => new Date(a.inst.dueDate).getTime() - new Date(b.inst.dueDate).getTime());

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-1 px-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800">لوحة التحكم</h1>
        <p className="text-slate-500 text-sm">متابعة رأس المال والديون النشطة.</p>
      </header>

      {/* إجمالي المديونية العامة - متناسب مع الموبايل */}
      <div className="bg-indigo-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="space-y-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-200 font-bold text-xs uppercase tracking-wider">
              <Briefcase size={18} />
              <span>إجمالي مديونية المحل</span>
            </div>
            <h2 className="text-3xl md:text-6xl font-black">{formatCurrency(totalGlobalDebt)}</h2>
            <p className="text-indigo-300 text-xs md:text-sm font-medium">نقدي + قيمة {totalRemainingGoldGrams.toFixed(2)} جرام ذهب</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="flex justify-around items-center gap-2">
              <div className="text-center flex-1">
                <p className="text-[10px] text-indigo-200 font-bold mb-1">السيولة</p>
                <p className="text-sm md:text-xl font-black">{formatCurrency(totalRemainingEGP)}</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-indigo-200 font-bold mb-1">الذهب</p>
                <p className="text-sm md:text-xl font-black">{totalRemainingGoldGrams.toFixed(2)} ج</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        <StatCard 
          title="الذهب المطلوب" 
          value={formatGrams(totalRemainingGoldGrams)} 
          icon={<Coins size={20} className="text-amber-600" />} 
          bgColor="bg-amber-50"
        />
        <StatCard 
          title="متأخرات" 
          value={overdueItems.length.toString()} 
          icon={<AlertCircle size={20} className={overdueItems.length > 0 ? "text-red-600 animate-pulse" : "text-slate-600"} />} 
          bgColor={overdueItems.length > 0 ? "bg-red-50" : "bg-slate-50"}
        />
        <StatCard 
          title="عملاء نشطون" 
          value={activeCustomers.length.toString()} 
          icon={<Users size={20} className="text-blue-600" />} 
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <BellRing size={18} /> تنبيهات المتأخرين
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto custom-scrollbar">
            {overdueItems.length > 0 ? overdueItems.map(({ customer, debt, inst }, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/customer/${customer.id}`} className="font-black text-slate-800 hover:text-indigo-600 truncate block text-sm md:text-base">{customer.name}</Link>
                  <div className="text-[10px] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-red-600 font-bold">تاريخ: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</span>
                    <span className="text-slate-500 font-bold">قيمة: {debt.type === DebtType.GOLD ? formatGrams(inst.amount) : formatCurrency(inst.amount)}</span>
                  </div>
                </div>
                <Link to={`/customer/${customer.id}`} className="shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-[10px]">عرض</Link>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic text-sm">لا توجد أقساط متأخرة.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 font-black text-base">أحدث العملاء</div>
          <div className="divide-y divide-slate-100">
            {activeCustomers.slice(0, 5).map(customer => (
              <Link key={customer.id} to={`/customer/${customer.id}`} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <span className="font-bold text-slate-700 text-sm truncate ml-2">{customer.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{new Date(customer.createdAt).toLocaleDateString('ar-EG')}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: any) => (
  <div className={`p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between bg-white`}>
    <div>
      <p className="text-[10px] text-slate-500 mb-1 font-black uppercase">{title}</p>
      <p className="text-xl md:text-2xl font-black text-slate-800">{value}</p>
    </div>
    <div className={`w-10 h-10 md:w-14 md:h-14 ${bgColor} rounded-xl md:rounded-2xl flex items-center justify-center shrink-0`}>{icon}</div>
  </div>
);

export default Dashboard;
