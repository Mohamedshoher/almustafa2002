
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Customer, DebtType, PaymentRecord, Debt, Installment, DebtImage } from '../types';
import { formatCurrency, formatGrams, getRemainingBalance, getPaidAmount, applyPaymentToDebt, adjustDebtAmount } from '../utils/calculations';
import { exportCustomerReport } from '../utils/pdfExport';
import { Phone, MessageSquare, CheckCircle, Calendar, Package, ArrowRight, Fullscreen, PieChart, Wallet, CreditCard, X, Clock, History, PlusCircle, AlertTriangle, Archive, Trash2, RotateCcw, Coins, BellRing, FilePlus, Camera, Edit2, Check, FileDown } from 'lucide-react';

const CustomerDetail: React.FC<{ 
  customers: Customer[], 
  onUpdate: (id: string, updatedCustomer: Customer) => void,
  onDelete: (id: string) => void,
  onToggleArchive: (id: string) => void
}> = ({ customers, onUpdate, onDelete, onToggleArchive }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find(c => c.id === id);
  const [selectedImage, setSelectedImage] = useState<DebtImage | null>(null);
  
  const [paymentModalDebtId, setPaymentModalDebtId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState<string>('');
  const [adjustModalDebtId, setAdjustModalDebtId] = useState<string | null>(null);
  const [adjustInput, setAdjustInput] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [showDateForInst, setShowDateForInst] = useState<string | null>(null);

  const [editingLabelDebtId, setEditingLabelDebtId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  if (!customer) return <div className="text-center py-20 font-bold text-slate-400">العميل غير موجود</div>;

  const getWhatsAppNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  };

  const handleUpdateLabel = (debtId: string) => {
    const updatedDebts = customer.debts.map(d => 
      d.id === debtId ? { ...d, label: tempLabel || d.label } : d
    );
    onUpdate(customer.id, { ...customer, debts: updatedDebts });
    setEditingLabelDebtId(null);
  };

  const handleDeleteDebt = (debtId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) {
      const updatedDebts = customer.debts.filter(d => d.id !== debtId);
      onUpdate(customer.id, { ...customer, debts: updatedDebts });
    }
  };

  const handleAddImages = (debtId: string, files: FileList | null) => {
    if (!files) return;
    const debt = customer.debts.find(d => d.id === debtId);
    if (!debt) return;

    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: DebtImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          addedAt: new Date().toISOString()
        };
        const updatedDebts = customer.debts.map(d => 
          d.id === debtId ? { ...d, images: [...d.images, newImage] } : d
        );
        onUpdate(customer.id, { ...customer, debts: updatedDebts });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebtId || !paymentInput) return;
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
        const now = new Date().toISOString();
        const instToUpdate = debt.installments.find(i => i.id === installmentId);
        if (!instToUpdate) return debt;
        const isNowPaid = !instToUpdate.paid;
        const paidValue = isNowPaid ? instToUpdate.amount : 0;
        const newInstallments = debt.installments.map(inst => inst.id === installmentId ? { ...inst, paid: isNowPaid, paidAmount: paidValue, paymentDate: isNowPaid ? now : undefined } : inst);
        return { ...debt, installments: newInstallments };
      }
      return debt;
    });
    onUpdate(customer.id, { ...customer, debts: updatedDebts });
  };

  const sendInstallmentReminder = (inst: Installment, debt: Debt) => {
    const monthYear = new Date(inst.dueDate).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    const amountText = debt.type === DebtType.GOLD ? formatGrams(inst.amount) : formatCurrency(inst.amount);
    const message = `تذكير بموعد استحقاق قسط شهر ${monthYear} بقيمة ${amountText}.`;
    const whatsappUrl = `https://wa.me/${getWhatsAppNumber(customer.phone)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="p-3 bg-white rounded-full border shadow-sm text-slate-400 hover:text-indigo-600 transition-all"><ArrowRight size={24} /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-800">{customer.name}</h1>
              {customer.isArchived && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">مؤرشف</span>}
            </div>
            <p className="text-slate-500 font-mono font-bold">{customer.phone}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <button 
            onClick={() => exportCustomerReport(customer)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-black hover:bg-indigo-600 hover:text-white transition-all"
          >
            <FileDown size={18} />
            <span>تحميل كشف حساب PDF</span>
          </button>
          <Link to={`/customer/${customer.id}/add-debt`} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100"><FilePlus size={18} /> إضافة فاتورة</Link>
          <div className="w-px h-8 bg-slate-100 mx-1"></div>
          <a href={`tel:${customer.phone}`} className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors"><Phone size={20} /></a>
          <a href={`https://wa.me/${getWhatsAppNumber(customer.phone)}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"><MessageSquare size={20} /></a>
        </div>
      </header>

      {[...customer.debts].reverse().map((debt) => {
        const remaining = getRemainingBalance(debt);
        const paid = getPaidAmount(debt);
        const percentage = Math.round((paid / (paid + remaining || 1)) * 100);
        
        return (
          <div key={debt.id} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden transition-all hover:shadow-xl">
              <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b flex flex-wrap justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${debt.type === DebtType.GOLD ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{debt.type === DebtType.GOLD ? <Coins size={28} /> : <Wallet size={28} />}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 group">
                      {editingLabelDebtId === debt.id ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus className="text-2xl font-black text-indigo-700 border-b-2 border-indigo-500 outline-none" value={tempLabel} onChange={(e) => setTempLabel(e.target.value)} onBlur={() => handleUpdateLabel(debt.id)} />
                          <button onClick={() => handleUpdateLabel(debt.id)} className="text-emerald-500"><Check size={20}/></button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-slate-800">{debt.label}</h2>
                          <button onClick={() => { setEditingLabelDebtId(debt.id); setTempLabel(debt.label); }} className="text-slate-300 hover:text-indigo-600"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteDebt(debt.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 font-bold">
                      <span>البداية: {new Date(debt.startDate).toLocaleDateString('ar-EG')}</span>
                      <span className="bg-slate-100 px-2 rounded">{debt.type === DebtType.GOLD ? 'ذهب' : 'نقدي'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right border-r-2 pr-6 border-slate-200">
                    <div className="text-xs text-emerald-600 font-extrabold mb-1">المتبقي</div>
                    <div className="text-3xl font-black text-indigo-700">{debt.type === DebtType.GOLD ? formatGrams(remaining) : formatCurrency(remaining)}</div>
                  </div>
                  <button onClick={() => setPaymentModalDebtId(debt.id)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"><CreditCard size={18} /> سداد</button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-700 border-b pb-3 flex items-center gap-2"><PieChart size={20} className="text-indigo-500" /> ملخص الحالة</h3>
                  <div className="bg-slate-50 p-6 rounded-2xl space-y-4 shadow-inner">
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-500">القيمة الإجمالية</span><span>{debt.type === DebtType.GOLD ? formatGrams(debt.goldGrams!) : formatCurrency(debt.amountInEGP)}</span></div>
                    <div className="flex justify-between text-sm font-bold"><span className="text-slate-500">تم سداد</span><span className="text-emerald-600">{debt.type === DebtType.GOLD ? formatGrams(paid) : formatCurrency(paid)}</span></div>
                    <div className="pt-2"><div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${percentage}%` }}></div></div></div>
                    <p className="text-center font-black text-slate-700 text-xs">نسبة السداد: {percentage}%</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3 font-bold text-slate-700 text-sm"><span>المرفقات</span> <label className="cursor-pointer text-indigo-600"><Camera size={18} /><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleAddImages(debt.id, e.target.files)} /></label></div>
                    <div className="flex flex-wrap gap-2">
                      {debt.images.map(img => <img key={img.id} src={img.url} className="w-14 h-14 rounded-xl object-cover cursor-pointer border border-slate-100" onClick={() => setSelectedImage(img)} />)}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-bold text-slate-700 border-b pb-3 mb-6 flex items-center gap-2"><Calendar size={20} className="text-indigo-500" /> جدول الأقساط</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {debt.installments.map((inst, idx) => (
                      <div key={inst.id} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${inst.paid ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50'}`}>
                        <div>
                          <p className="text-sm font-black text-slate-800">{new Date(inst.dueDate).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</p>
                          <p className="text-[11px] font-bold text-slate-400">القيمة: {debt.type === DebtType.GOLD ? inst.amount.toFixed(2) : inst.amount.toFixed(0)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!inst.paid && <button onClick={() => sendInstallmentReminder(inst, debt)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl"><BellRing size={20} /></button>}
                          <button onClick={() => toggleInstallment(debt.id, inst.id)} className={`p-2 rounded-xl transition-all ${inst.paid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}><CheckCircle size={22} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {paymentModalDebtId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={handleCustomPayment} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8">
             <h2 className="text-xl font-black mb-6 text-center">سداد مبلغ نقدي</h2>
             <input autoFocus type="number" step="0.01" className="w-full p-6 border-2 border-slate-100 rounded-2xl text-4xl font-black text-center outline-none focus:border-indigo-500 mb-6" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
             <div className="flex gap-4">
               <button className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black">تأكيد السداد</button>
               <button type="button" onClick={() => setPaymentModalDebtId(null)} className="px-6 py-4 bg-slate-100 rounded-2xl font-bold">إلغاء</button>
             </div>
          </form>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage.url} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />
          <button className="absolute top-8 left-8 text-white"><X size={36} /></button>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
