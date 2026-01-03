
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Customer, DebtType } from "../types";
import { formatCurrency, formatGrams, getRemainingBalance } from "./calculations";

export const exportCustomerReport = (customer: Customer) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.text("AL-MUSTAFA STORE", 105, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(`Customer Statement: ${customer.name}`, 20, 35);
  doc.setFontSize(10);
  doc.text(`Phone: ${customer.phone}`, 20, 42);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 160, 42);

  let startY = 55;

  customer.debts.forEach((debt, index) => {
    doc.setFontSize(12);
    doc.text(`Invoice #${index + 1}: ${debt.label}`, 20, startY);
    
    const remaining = getRemainingBalance(debt);
    const remainingText = debt.type === DebtType.GOLD ? formatGrams(remaining) : formatCurrency(remaining);
    doc.text(`Remaining: ${remainingText}`, 140, startY);

    const tableData = debt.installments.map((inst, i) => [
      i + 1,
      inst.dueDate,
      debt.type === DebtType.GOLD ? inst.amount.toFixed(2) : inst.amount.toFixed(0),
      inst.paid ? "PAID" : "PENDING"
    ]);

    (doc as any).autoTable({
      startY: startY + 5,
      head: [['#', 'Due Date', 'Amount', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20 }
    });

    startY = (doc as any).lastAutoTable.finalY + 15;
  });

  doc.save(`Statement_${customer.name}.pdf`);
};
