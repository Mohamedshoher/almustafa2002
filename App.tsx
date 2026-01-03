
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import AddCustomer from './pages/AddCustomer';
import CustomerDetail from './pages/CustomerDetail';
import { Customer } from './types';
import { loadCustomers, saveCustomers } from './services/storageService';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(loadCustomers());
  }, []);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const handleUpdateCustomer = (id: string, updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleToggleArchive = (id: string) => {
    setCustomers(prev => prev.map(c => 
      c.id === id ? { ...c, isArchived: !c.isArchived } : c
    ));
  };

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
