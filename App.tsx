
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import AddCustomer from './pages/AddCustomer';
import AddDebt from './pages/AddDebt';
import CustomerDetail from './pages/CustomerDetail';
import { Customer, Debt } from './types';
import { subscribeToCustomers, syncCustomerToCloud, deleteCustomerFromCloud } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // الاشتراك في التغييرات السحابية
    const unsubscribe = subscribeToCustomers((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCustomer = async (customer: Customer) => {
    await syncCustomerToCloud(customer);
  };

  const handleUpdateCustomer = async (id: string, updated: Customer) => {
    await syncCustomerToCloud(updated);
  };

  const handleAddDebtToCustomer = async (customerId: string, newDebt: Debt) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const updated = { ...customer, debts: [...customer.debts, newDebt] };
      await syncCustomerToCloud(updated);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer && window.confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟ سيتم حذف بياناته من السحابة وصوره من هذا الجهاز.')) {
      await deleteCustomerFromCloud(id, customer.debts);
    }
  };

  const handleToggleArchive = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      const updated = { ...customer, isArchived: !customer.isArchived };
      await syncCustomerToCloud(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="font-black text-slate-600 animate-pulse">جاري الاتصال بقاعدة البيانات...</p>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard customers={customers} />} />
          <Route 
            path="/customers" 
            element={
              <CustomerList 
                customers={customers} 
                onDelete={handleDeleteCustomer} 
                onToggleArchive={handleToggleArchive} 
              />
            } 
          />
          <Route path="/add-customer" element={<AddCustomer onAdd={handleAddCustomer} />} />
          <Route 
            path="/customer/:id/add-debt" 
            element={
              <AddDebt 
                customers={customers} 
                onAddDebt={handleAddDebtToCustomer} 
              />
            } 
          />
          <Route 
            path="/customer/:id" 
            element={
              <CustomerDetail 
                customers={customers} 
                onUpdate={handleUpdateCustomer} 
                onDelete={handleDeleteCustomer}
                onToggleArchive={handleToggleArchive}
              />
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
