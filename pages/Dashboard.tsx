
import React from 'react';
import { Customer, DebtType } from '../types';
import { formatCurrency, formatGrams, getRemainingBalance } from '../utils/calculations';
import { TrendingUp, Users, AlertCircle, Coins, BellRing, Briefcase, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadGoldCache } from '../services/storageService';
import { exportToExcel } from '../utils/excelExport';

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

  // إجمالي المديونية العامة للمحل (نقدي + ذهب مقوم بسعر اليوم)
  const totalGlobalDebt = totalRemainingEGP + (totalRemainingGoldGrams * goldPrice);

  const overdueItems = activeCustomers.flatMap(customer => 
    customer.debts.flatMap(debt => 
      debt.installments
        .filter(inst => !inst.paid && new Date(inst.dueDate) < new Date())
        .map(inst => ({ customer, debt, inst }))
    )
  ).sort((a, b) => new Date(a.inst.dueDate).getTime() - new Date(b.inst.dueDate).getTime());

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">لوحة التحكم</h1>
          <p className="text-slate-500">متابعة رأس مال المحل والديون النشطة.</p>
        </div>
        <button 
          onClick={() => exportToExcel(activeCustomers)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
        >
          <FileSpreadsheet size={20} />
          <span>تصدير جرد إكسل</span>
        </button>
      </header>

      {/* إجمالي المديونية العامة */}
      <div className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 text-indigo-200 font-bold uppercase tracking-wider">
              <Briefcase size={24} />
              <span>إجمالي مديونية المحل العامة</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black">{formatCurrency(totalGlobalDebt)}</h2>
            <p className="text-indigo-300 font-medium">السيولة النقدية + قيمة الذهب ({totalRemainingGoldGrams.toFixed(2)} جرام)</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
            <div className="flex gap-10">
              <div className="text-center">
                <p className="text-xs text-indigo-200 font-bold mb-1">السيولة</p>
                <p className="text-xl font-black">{formatCurrency(totalRemainingEGP)}</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-xs text-indigo-200 font-bold mb-1">الذهب</p>
                <p className="text-xl font-black">{totalRemainingGoldGrams.toFixed(2)} ج</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="جرامات الذهب المطلوبة" 
          value={formatGrams(totalRemainingGoldGrams)} 
          icon={<Coins className="text-amber-600" />} 
          bgColor="bg-amber-50"
        />
        <StatCard 
          title="الأقساط المتأخرة" 
          value={overdueItems.length.toString()} 
          icon={<AlertCircle className={overdueItems.length > 0 ? "text-red-600 animate-pulse" : "text-slate-600"} />} 
          bgColor={overdueItems.length > 0 ? "bg-red-50" : "bg-slate-50"}
        />
        <StatCard 
          title="العملاء النشطون" 
          value={activeCustomers.length.toString()} 
          icon={<Users className="text-blue-600" />} 
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
              <BellRing size={20} /> تنبيهات المتأخرين
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {overdueItems.length > 0 ? overdueItems.map(({ customer, debt, inst }, idx) => (
              <div key={idx} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <Link to={`/customer/${customer.id}`} className="font-black text-slate-800 hover:text-indigo-600 block text-lg">{customer.name}</Link>
                  <div className="text-xs mt-1 flex gap-4">
                    <span className="text-red-600 font-bold">تأخير: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</span>
                    <span className="text-slate-500">القيمة: {debt.type === DebtType.GOLD ? formatGrams(inst.amount) : formatCurrency(inst.amount)}</span>
                  </div>
                </div>
                <Link to={`/customer/${customer.id}`} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs">عرض الحساب</Link>
              </div>
            )) : (
              <div className="p-20 text-center text-slate-400 italic">لا توجد أقساط متأخرة حالياً.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 font-black text-lg">أحدث العملاء</div>
          <div className="divide-y divide-slate-100">
            {activeCustomers.slice(0, 8).map(customer => (
              <Link key={customer.id} to={`/customer/${customer.id}`} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <span className="font-bold text-slate-700">{customer.name}</span>
                <span className="text-[10px] text-slate-400">{new Date(customer.createdAt).toLocaleDateString('ar-EG')}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: any) => (
  <div className={`p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between bg-white transition-all hover:shadow-md`}>
    <div>
      <p className="text-xs text-slate-500 mb-2 font-black uppercase">{title}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
    <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center`}>{icon}</div>
  </div>
);

export default Dashboard;
