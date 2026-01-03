
import React from 'react';
import { Customer, DebtType } from '../types';
import { formatCurrency, formatGrams, getRemainingBalance } from '../utils/calculations';
import { TrendingUp, Users, AlertCircle, Coins, Archive, BellRing, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  const activeCustomers = customers.filter(c => !c.isArchived);
  const archivedCount = customers.filter(c => c.isArchived).length;

  const totalRemainingEGP = activeCustomers.reduce((acc, c) => 
    acc + c.debts.reduce((sum, d) => {
      if (d.type === DebtType.CASH) {
        return sum + getRemainingBalance(d);
      } else if (d.type === DebtType.GOLD && d.goldPriceAtRegistration) {
        return sum + (getRemainingBalance(d) * d.goldPriceAtRegistration);
      }
      return sum;
    }, 0), 0
  );

  const totalRemainingGoldGrams = activeCustomers.reduce((acc, c) => 
    acc + c.debts.reduce((sum, d) => 
      sum + (d.type === DebtType.GOLD ? getRemainingBalance(d) : 0), 0
    ), 0
  );

  // استخراج الأقساط المتأخرة
  const overdueItems = activeCustomers.flatMap(customer => 
    customer.debts.flatMap(debt => 
      debt.installments
        .filter(inst => !inst.paid && new Date(inst.dueDate) < new Date())
        .map(inst => ({
          customer,
          debt,
          inst
        }))
    )
  ).sort((a, b) => new Date(a.inst.dueDate).getTime() - new Date(b.inst.dueDate).getTime());

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="text-slate-500">نظرة عامة على حالة الحسابات النشطة والعمليات المطلوبة.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="المديونية النقدية" 
          value={formatCurrency(totalRemainingEGP)} 
          icon={<TrendingUp className="text-emerald-600" />} 
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="جرامات الذهب" 
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
          title="إجمالي العملاء" 
          value={activeCustomers.length.toString()} 
          icon={<Users className="text-blue-600" />} 
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* قائمة العمليات المتأخرة */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/30">
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
              <BellRing size={20} />
              تنبيهات الأقساط المتأخرة
            </h2>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
              {overdueItems.length} تنبيه
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {overdueItems.length > 0 ? overdueItems.map(({ customer, debt, inst }, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <Link to={`/customer/${customer.id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors block">
                    {customer.name}
                  </Link>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span className="text-red-600 font-bold">تأخير منذ: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}</span>
                    <span>المبلغ: {debt.type === DebtType.GOLD ? formatGrams(inst.amount) : formatCurrency(inst.amount)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/customer/${customer.id}`} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Users size={18} />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">لا توجد أقساط متأخرة حالياً، عمل رائع!</div>
            )}
          </div>
        </div>

        {/* أحدث العملاء */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">أحدث العملاء</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeCustomers.slice(0, 6).map(customer => (
              <div key={customer.id} className="p-4 flex justify-between items-center">
                <span className="font-medium text-slate-700">{customer.name}</span>
                <Link to={`/customer/${customer.id}`} className="text-xs font-bold text-indigo-600 hover:underline">عرض</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: any) => (
  <div className={`p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between bg-white transition-transform hover:scale-[1.02]`}>
    <div>
      <p className="text-sm text-slate-500 mb-1 font-bold">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
