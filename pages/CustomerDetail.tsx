
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Customer, DebtType, Debt, Installment, DebtImage } from '../types';
import { formatCurrency, formatGrams, getRemainingBalance, getPaidAmount, applyPaymentToDebt } from '../utils/calculations';
import { exportCustomerReport } from '../utils/pdfExport';
import { Phone, MessageSquare, CheckCircle, Calendar, ArrowRight, X, Wallet, CreditCard, BellRing, FilePlus, Camera, Edit2, Check, FileDown, Coins, Trash2 } from 'lucide-react';

const CustomerDetail: React.FC<{ 
  customers: Customer[], 
  onUpdate: (id: string, updatedCustomer: Customer) => void,
  onDelete: (id: string) => void,
  onToggleArchive: (id: string) => void
}> = ({ customers, onUpdate, onDelete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find(c => c.id === id);
  const [selectedImage, setSelectedImage] = useState<DebtImage | null>(null);
  
  const [paymentModalDebtId, setPaymentModalDebtId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState<string>('');
  const [editingLabelDebtId, setEditingLabelDebtId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  if (!customer) return <div className="text-center py-20 font-bold text-slate-400">العميل غير موجود</div>;

  const getWhatsAppNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  };

  const handleUpdateLabel = (debtId: string) => {
    const updatedDebts = customer.debts.map(d => d.id === debtId ? { ...d, label: tempLabel || d.label } : d);
    onUpdate(customer.id, { ...customer, debts: updatedDebts });
    setEditingLabelDebtId(null);
  };

  const handleDeleteDebt = (debtId: string) => {
    if (window.confirm('حذف الفاتورة نهائياً؟')) {
      const updatedDebts = customer.debts.filter(d => d.id !== debtId);
      onUpdate(customer.id, { ...customer, debts: updatedDebts });
    }
  };

  const handleAddImages = (debtId: string, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = { id: Math.random().toString(36).substr(2, 9), url: reader.result as string, addedAt: new Date().toISOString() };
        const updatedDebts = customer.debts.map(d => d.id === debtId ? { ...d, images: [...d.images, newImage] } : d);
        onUpdate(customer.id, { ...customer, debts: updatedDebts });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentInput);
    if (isNaN(amount) || amount <= 0) return;
    const updatedDebts = customer.debts.map(debt => debt.id === paymentModalDebtId ? applyPaymentToDebt(debt, amount) : debt);
    onUpdate(customer.id, { ...customer, debts: updatedDebts });
    setPaymentModalDebtId(null);
    setPaymentInput('');
  };

  const toggleInstallment = (debtId: string, installmentId: string) => {
    const updatedDebts = customer.debts.map(debt => {
      if (debt.id === debtId) {
        const instToUpdate = debt.installments.find(i => i.id === installmentId);
        if (!instToUpdate) return debt;
        const isNowPaid = !instToUpdate.paid;
        const newInstallments = debt.installments.map(inst => inst.id === installmentId ? { ...inst, paid: isNowPaid, paidAmount: isNowPaid ? inst.amount : 0, paymentDate: isNowPaid ? new Date().toISOString() : undefined } : inst);
        return { ...debt, installments: newInstallments };
      }
      return debt;
    });
    onUpdate(customer.id, { ...customer, debts: updatedDebts });
  };

  return (
    <div className="space-y-4 pb-10">
      <header className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/customers" className="p-2 bg-slate-50 rounded-full text-slate-400"><ArrowRight size={20} /></Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-800 truncate">{customer.name}</h1>
            <p className="text-xs text-slate-400 font-bold">{customer.phone}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportCustomerReport(customer)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black"><FileDown size={14} /> كشف PDF</button>
          <Link to={`/customer/${customer.id}/add-debt`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black"><FilePlus size={14} /> فاتورة</Link>
          <a href={`tel:${customer.phone}`} className="shrink-0 w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center"><Phone size={18} /></a>
          <a href={`https://wa.me/${getWhatsAppNumber(customer.phone)}`} target="_blank" rel="noreferrer" className="shrink-0 w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center"><MessageSquare size={18} /></a>
        </div>
      </header>

      {[...customer.debts].reverse().map((debt) => {
        const remaining = getRemainingBalance(debt);
        const paid = getPaidAmount(debt);
        const percentage = Math.round((paid / (paid + remaining || 1)) * 100);
        
        return (
          <div key={debt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between gap-3">
               <div className="flex items-center gap-2 min-w-0">
                 <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${debt.type === DebtType.GOLD ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                   {debt.type === DebtType.GOLD ? <Coins size={16} /> : <Wallet size={16} />}
                 </div>
                 <h2 className="text-sm font-black text-slate-800 truncate">{debt.label}</h2>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleDeleteDebt(debt.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={16} /></button>
                  <button onClick={() => setPaymentModalDebtId(debt.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black">سداد</button>
               </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-6">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-around items-center">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">المتبقي</p>
                  <p className="text-base font-black text-indigo-700">{debt.type === DebtType.GOLD ? formatGrams(remaining) : formatCurrency(remaining)}</p>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">المدفوع</p>
                  <p className="text-base font-black text-emerald-600">{debt.type === DebtType.GOLD ? formatGrams(paid) : formatCurrency(paid)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-tight">جدول الأقساط</h3>
                  <span className="text-[10px] text-indigo-600 font-bold">{percentage}% مسدد</span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                  {debt.installments.map((inst) => (
                    <div key={inst.id} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${inst.paid ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate">{new Date(inst.dueDate).toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' })}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{debt.type === DebtType.GOLD ? inst.amount.toFixed(2) + ' ج' : inst.amount.toFixed(0) + ' ج.م'}</p>
                      </div>
                      <button onClick={() => toggleInstallment(debt.id, inst.id)} className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${inst.paid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {debt.images.map(img => <img key={img.id} src={img.url} className="w-10 h-10 rounded-lg object-cover" onClick={() => setSelectedImage(img)} />)}
                <label className="w-10 h-10 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer text-slate-400">
                  <Camera size={16} />
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddImages(debt.id, e.target.files)} />
                </label>
              </div>
            </div>
          </div>
        );
      })}

      {paymentModalDebtId && (
        <div className="fixed inset-0 bg-slate-900/80 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={handleCustomPayment} className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-5 duration-300">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-black uppercase">سداد نقدي</h2>
               <button type="button" onClick={() => setPaymentModalDebtId(null)} className="text-slate-400"><X size={24}/></button>
             </div>
             <input autoFocus type="number" step="0.01" className="w-full p-4 border-2 border-indigo-100 rounded-2xl text-3xl font-black text-center outline-none focus:border-indigo-500 mb-6 bg-slate-50" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} placeholder="0.00" />
             <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">تأكيد العملية</button>
          </form>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage.url} className="max-w-full max-h-[70vh] rounded-xl shadow-2xl" />
          <button className="absolute top-6 left-6 text-white"><X size={32} /></button>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
