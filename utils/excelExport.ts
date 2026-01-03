
import * as XLSX from 'xlsx';
import { Customer, DebtType } from '../types';
import { getRemainingBalance } from './calculations';

export const exportToExcel = (customers: Customer[]) => {
  const data = customers.flatMap(c => 
    c.debts.map(d => ({
      'العميل': c.name,
      'الهاتف': c.phone,
      'الفاتورة': d.label,
      'النوع': d.type === DebtType.GOLD ? 'ذهب' : 'نقدي',
      'المتبقي': getRemainingBalance(d),
      'الوحدة': d.type === DebtType.GOLD ? 'جرام' : 'ج.م',
      'تاريخ البدء': d.startDate.split('T')[0]
    }))
  );

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المديونيات");
  XLSX.writeFile(wb, `جرد_المحل_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};
