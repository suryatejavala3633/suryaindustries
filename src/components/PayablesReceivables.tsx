import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, Trash2, Upload, FileText, Calendar, Clock, AlertCircle, CheckCircle, IndianRupee, Users, Package, TrendingUp, CreditCard } from 'lucide-react';
import { Purchase, PurchasePayment, SalesRecord, SalesPayment, Vendor, LorryFreight } from '../types';
import { formatCurrency, formatDecimal, calculateDaysDue } from '../utils/calculations';
import { savePurchases, loadPurchases, savePurchasePayments, loadPurchasePayments, saveSalesRecords, loadSalesRecords, saveSalesPayments, loadSalesPayments, saveVendors, loadVendors, loadLorryFreights } from '../utils/dataStorage';
import StatsCard from './StatsCard';

const PayablesReceivables: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchases' | 'sales' | 'vendors' | 'freight'>('dashboard');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasePayments, setPurchasePayments] = useState<PurchasePayment[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [salesPayments, setSalesPayments] = useState<SalesPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    setPurchases(loadPurchases());
    setPurchasePayments(loadPurchasePayments());
    setSalesRecords(loadSalesRecords());
    setSalesPayments(loadSalesPayments());
    setVendors(loadVendors());
    setLorryFreights(loadLorryFreights());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (purchases.length > 0) savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    if (purchasePayments.length > 0) savePurchasePayments(purchasePayments);
  }, [purchasePayments]);

  useEffect(() => {
    if (salesRecords.length > 0) saveSalesRecords(salesRecords);
  }, [salesRecords]);

  useEffect(() => {
    if (salesPayments.length > 0) saveSalesPayments(salesPayments);
  }, [salesPayments]);

  useEffect(() => {
    if (vendors.length > 0) saveVendors(vendors);
  }, [vendors]);

  // Form states
  const [purchaseForm, setPurchaseForm] = useState({
    billNumber: '',
    billDate: '',
    vendorName: '',
    vendorGST: '',
    vendorAddress: '',
    vendorPhone: '',
    category: 'gst' as 'gst' | 'cash',
    paymentTerms: '30',
    items: [{ itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }],
    notes: ''
  });

  const [salesForm, setSalesForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    partyName: '',
    partyGST: '',
    partyAddress: '',
    partyPhone: '',
    lorryNumber: '',
    paymentTerms: '30',
    items: [{ itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }],
    notes: ''
  });

  const [vendorForm, setVendorForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    paymentTerms: '30',
    notes: ''
  });

  // Calculate summary stats
  const totalPayables = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.balanceAmount, 0), [purchases]);
  const totalReceivables = useMemo(() => salesRecords.reduce((sum, sale) => sum + sale.balanceAmount, 0), [salesRecords]);
  const totalFreightDue = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.balanceAmount, 0), [lorryFreights]);
  
  const overduePayables = useMemo(() => {
    return purchases.filter(p => p.balanceAmount > 0 && calculateDaysDue(p.dueDate) > 0).reduce((sum, p) => sum + p.balanceAmount, 0);
  }, [purchases]);

  const overdueReceivables = useMemo(() => {
    return salesRecords.filter(s => s.balanceAmount > 0 && calculateDaysDue(s.dueDate) > 0).reduce((sum, s) => sum + s.balanceAmount, 0);
  }, [salesRecords]);

  // Helper functions
  const calculateItemTotal = (quantity: number, rate: number, gstRate: number) => {
    const amount = quantity * rate;
    const gstAmount = (amount * gstRate) / 100;
    return { amount, gstAmount, totalAmount: amount + gstAmount };
  };

  const calculateFormTotal = (items: any[]) => {
    let subtotal = 0;
    let gstAmount = 0;
    
    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gst = parseFloat(item.gstRate) || 0;
      const { amount, gstAmount: itemGst } = calculateItemTotal(qty, rate, gst);
      subtotal += amount;
      gstAmount += itemGst;
    });
    
    return { subtotal, gstAmount, totalAmount: subtotal + gstAmount };
  };

  // Form handlers
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = purchaseForm.items.map(item => {
      const qty = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const gstRate = parseFloat(item.gstRate);
      const { amount, gstAmount, totalAmount } = calculateItemTotal(qty, rate, gstRate);
      
      return {
        id: Date.now().toString() + Math.random(),
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit,
        rate,
        gstRate,
        amount,
        gstAmount,
        totalAmount
      };
    });

    const { subtotal, gstAmount, totalAmount } = calculateFormTotal(purchaseForm.items);
    const dueDate = new Date(purchaseForm.billDate);
    dueDate.setDate(dueDate.getDate() + parseInt(purchaseForm.paymentTerms));

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      billNumber: purchaseForm.billNumber,
      billDate: purchaseForm.billDate,
      vendorName: purchaseForm.vendorName,
      vendorGST: purchaseForm.vendorGST,
      vendorAddress: purchaseForm.vendorAddress,
      vendorPhone: purchaseForm.vendorPhone,
      items,
      subtotal,
      gstAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'pending',
      paymentTerms: parseInt(purchaseForm.paymentTerms),
      dueDate: dueDate.toISOString().split('T')[0],
      category: purchaseForm.category,
      notes: purchaseForm.notes
    };

    setPurchases([...purchases, newPurchase]);
    setPurchaseForm({
      billNumber: '',
      billDate: '',
      vendorName: '',
      vendorGST: '',
      vendorAddress: '',
      vendorPhone: '',
      category: 'gst',
      paymentTerms: '30',
      items: [{ itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = salesForm.items.map(item => {
      const qty = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const gstRate = parseFloat(item.gstRate);
      const { amount, gstAmount, totalAmount } = calculateItemTotal(qty, rate, gstRate);
      
      return {
        id: Date.now().toString() + Math.random(),
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit,
        rate,
        gstRate,
        amount,
        gstAmount,
        totalAmount
      };
    });

    const { subtotal, gstAmount, totalAmount } = calculateFormTotal(salesForm.items);
    const dueDate = new Date(salesForm.invoiceDate);
    dueDate.setDate(dueDate.getDate() + parseInt(salesForm.paymentTerms));

    const newSale: SalesRecord = {
      id: Date.now().toString(),
      invoiceNumber: salesForm.invoiceNumber,
      invoiceDate: salesForm.invoiceDate,
      partyName: salesForm.partyName,
      partyGST: salesForm.partyGST,
      partyAddress: salesForm.partyAddress,
      partyPhone: salesForm.partyPhone,
      lorryNumber: salesForm.lorryNumber,
      items,
      subtotal,
      gstAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'pending',
      paymentTerms: parseInt(salesForm.paymentTerms),
      dueDate: dueDate.toISOString().split('T')[0],
      notes: salesForm.notes
    };

    setSalesRecords([...salesRecords, newSale]);
    setSalesForm({
      invoiceNumber: '',
      invoiceDate: '',
      partyName: '',
      partyGST: '',
      partyAddress: '',
      partyPhone: '',
      lorryNumber: '',
      paymentTerms: '30',
      items: [{ itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVendor: Vendor = {
      id: Date.now().toString(),
      name: vendorForm.name,
      address: vendorForm.address,
      phone: vendorForm.phone,
      email: vendorForm.email,
      gstNumber: vendorForm.gstNumber,
      panNumber: vendorForm.panNumber,
      paymentTerms: parseInt(vendorForm.paymentTerms),
      createdDate: new Date().toISOString().split('T')[0],
      notes: vendorForm.notes
    };

    setVendors([...vendors, newVendor]);
    setVendorForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      gstNumber: '',
      panNumber: '',
      paymentTerms: '30',
      notes: ''
    });
    setShowAddForm(false);
  };

  // Delete functions
  const deletePurchase = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase record?')) {
      setPurchases(purchases.filter(p => p.id !== id));
      // Also delete related payments
      setPurchasePayments(purchasePayments.filter(pp => pp.purchaseId !== id));
    }
  };

  const deleteSalesRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales record?')) {
      setSalesRecords(salesRecords.filter(s => s.id !== id));
      // Also delete related payments
      setSalesPayments(salesPayments.filter(sp => sp.salesId !== id));
    }
  };

  const deleteVendor = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  // Add item to form
  const addItemToForm = (formType: 'purchase' | 'sales') => {
    if (formType === 'purchase') {
      setPurchaseForm({
        ...purchaseForm,
        items: [...purchaseForm.items, { itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }]
      });
    } else {
      setSalesForm({
        ...salesForm,
        items: [...salesForm.items, { itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }]
      });
    }
  };

  // Remove item from form
  const removeItemFromForm = (formType: 'purchase' | 'sales', index: number) => {
    if (formType === 'purchase') {
      const newItems = purchaseForm.items.filter((_, i) => i !== index);
      setPurchaseForm({ ...purchaseForm, items: newItems });
    } else {
      const newItems = salesForm.items.filter((_, i) => i !== index);
      setSalesForm({ ...salesForm, items: newItems });
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'purchases', label: 'Purchases', icon: Package },
    { id: 'sales', label: 'Sales', icon: IndianRupee },
    { id: 'freight', label: 'Freight Payables', icon: CreditCard },
    { id: 'vendors', label: 'Vendors', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payables & Receivables</h1>
            <p className="text-gray-600 mt-2">Manage purchases, sales, and outstanding amounts</p>
          </div>
          {(activeTab === 'purchases' || activeTab === 'sales' || activeTab === 'vendors') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'purchases' ? 'Purchase' : activeTab === 'sales' ? 'Sale' : 'Vendor'}
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Payables"
            value={formatCurrency(totalPayables)}
            subtitle={`${purchases.filter(p => p.balanceAmount > 0).length} pending`}
            icon={<Package className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
          <StatsCard
            title="Total Receivables"
            value={formatCurrency(totalReceivables)}
            subtitle={`${salesRecords.filter(s => s.balanceAmount > 0).length} pending`}
            icon={<IndianRupee className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Freight Due"
            value={formatCurrency(totalFreightDue)}
            subtitle={`${lorryFreights.filter(f => f.balanceAmount > 0).length} pending`}
            icon={<CreditCard className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Overdue Payables"
            value={formatCurrency(overduePayables)}
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Overdue Receivables"
            value={formatCurrency(overdueReceivables)}
            icon={<Clock className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Outstanding Payables */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Payables</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchases.filter(p => p.balanceAmount > 0).map((purchase) => {
                          const daysOverdue = calculateDaysDue(purchase.dueDate);
                          return (
                            <tr key={purchase.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">{purchase.vendorName}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{purchase.billNumber}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{new Date(purchase.billDate).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium text-red-600">{formatCurrency(purchase.balanceAmount)}</td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  daysOverdue > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {daysOverdue > 0 ? `${daysOverdue} days` : 'Not due'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Outstanding Receivables */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Receivables</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesRecords.filter(s => s.balanceAmount > 0).map((sale) => {
                          const daysOverdue = calculateDaysDue(sale.dueDate);
                          return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">{sale.partyName}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{sale.invoiceNumber}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{new Date(sale.invoiceDate).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium text-green-600">{formatCurrency(sale.balanceAmount)}</td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  daysOverdue > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {daysOverdue > 0 ? `${daysOverdue} days` : 'Not due'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Freight Payables */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Freight Payables</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.filter(f => f.balanceAmount > 0).map((freight) => (
                          <tr key={freight.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{freight.transporterName}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{freight.lorryNumber}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{freight.ackNumber}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{new Date(freight.dispatchDate).toLocaleDateString()}</td>
                            <td className="px-4 py-4 text-sm font-medium text-blue-600">{formatCurrency(freight.balanceAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Records</h3>
                {purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No purchase records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Details</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchases.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{purchase.billNumber}</div>
                                <div className="text-gray-500">{new Date(purchase.billDate).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{purchase.vendorName}</div>
                                {purchase.vendorGST && <div className="text-gray-500 text-xs">GST: {purchase.vendorGST}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                purchase.category === 'gst' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {purchase.category === 'gst' ? 'GST Purchase' : 'Cash Purchase'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(purchase.totalAmount)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-red-600">{formatCurrency(purchase.balanceAmount)}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                                purchase.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {purchase.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingItem(purchase.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deletePurchase(purchase.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Records</h3>
                {salesRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sales records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Details</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesRecords.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{sale.invoiceNumber}</div>
                                <div className="text-gray-500">{new Date(sale.invoiceDate).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{sale.partyName}</div>
                                {sale.partyGST && <div className="text-gray-500 text-xs">GST: {sale.partyGST}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">{sale.lorryNumber || '-'}</td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(sale.totalAmount)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-green-600">{formatCurrency(sale.balanceAmount)}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                                sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {sale.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingItem(sale.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteSalesRecord(sale.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'freight' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Freight Payables</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (MT)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lorryFreights.map((freight) => (
                        <tr key={freight.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{freight.ackNumber}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{freight.transporterName}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{freight.lorryNumber}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{formatDecimal(freight.quantityMT, 2)} MT</td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(freight.grossFreightAmount)}</td>
                          <td className="px-4 py-4 text-sm font-medium text-blue-600">{formatCurrency(freight.balanceAmount)}</td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              freight.paymentStatus === 'fully-paid' ? 'bg-green-100 text-green-800' : 
                              freight.paymentStatus === 'advance-paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {freight.paymentStatus.replace('-', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'vendors' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Database</h3>
                {vendors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No vendors added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vendors.map((vendor) => {
                          const vendorOutstanding = purchases
                            .filter(purchase => purchase.vendorName === vendor.name)
                            .reduce((sum, purchase) => sum + purchase.balanceAmount, 0);
                          
                          return (
                            <tr key={vendor.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">{vendor.name}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{vendor.phone}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{vendor.gstNumber || '-'}</td>
                              <td className="px-4 py-4 text-sm text-gray-600">{vendor.paymentTerms} days</td>
                              <td className="px-4 py-4 text-sm font-medium text-red-600">{formatCurrency(vendorOutstanding)}</td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setEditingItem(vendor.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteVendor(vendor.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Forms */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'purchases' ? 'Purchase' : activeTab === 'sales' ? 'Sale' : 'Vendor'}
                </h3>
                
                {activeTab === 'purchases' && (
                  <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                        <input
                          type="text"
                          value={purchaseForm.billNumber}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, billNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                        <input
                          type="date"
                          value={purchaseForm.billDate}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, billDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                        <input
                          type="text"
                          value={purchaseForm.vendorName}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={purchaseForm.category}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value as 'gst' | 'cash' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="gst">GST Purchase</option>
                          <option value="cash">Cash Purchase</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor GST</label>
                        <input
                          type="text"
                          value={purchaseForm.vendorGST}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorGST: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                        <input
                          type="number"
                          value={purchaseForm.paymentTerms}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">Items</h4>
                        <button
                          type="button"
                          onClick={() => addItemToForm('purchase')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Add Item
                        </button>
                      </div>
                      {purchaseForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => {
                                const newItems = [...purchaseForm.items];
                                newItems[index].itemName = e.target.value;
                                setPurchaseForm({ ...purchaseForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...purchaseForm.items];
                                newItems[index].quantity = e.target.value;
                                setPurchaseForm({ ...purchaseForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const newItems = [...purchaseForm.items];
                                newItems[index].unit = e.target.value;
                                setPurchaseForm({ ...purchaseForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="qtl">Quintals</option>
                              <option value="kg">Kilograms</option>
                              <option value="bag">Bags</option>
                              <option value="piece">Pieces</option>
                              <option value="liter">Liters</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => {
                                const newItems = [...purchaseForm.items];
                                newItems[index].rate = e.target.value;
                                setPurchaseForm({ ...purchaseForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                            <select
                              value={item.gstRate}
                              onChange={(e) => {
                                const newItems = [...purchaseForm.items];
                                newItems[index].gstRate = e.target.value;
                                setPurchaseForm({ ...purchaseForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            {purchaseForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemFromForm('purchase', index)}
                                className="text-red-600 hover:text-red-800 p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Calculation */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-right space-y-2">
                        {(() => {
                          const { subtotal, gstAmount, totalAmount } = calculateFormTotal(purchaseForm.items);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>GST Amount:</span>
                                <span>{formatCurrency(gstAmount)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(totalAmount)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Purchase
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'sales' && (
                  <form onSubmit={handleSalesSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={salesForm.invoiceNumber}
                          onChange={(e) => setSalesForm({ ...salesForm, invoiceNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={salesForm.invoiceDate}
                          onChange={(e) => setSalesForm({ ...salesForm, invoiceDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                        <input
                          type="text"
                          value={salesForm.partyName}
                          onChange={(e) => setSalesForm({ ...salesForm, partyName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Party GST</label>
                        <input
                          type="text"
                          value={salesForm.partyGST}
                          onChange={(e) => setSalesForm({ ...salesForm, partyGST: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lorry Number</label>
                        <input
                          type="text"
                          value={salesForm.lorryNumber}
                          onChange={(e) => setSalesForm({ ...salesForm, lorryNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                        <input
                          type="number"
                          value={salesForm.paymentTerms}
                          onChange={(e) => setSalesForm({ ...salesForm, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">Items</h4>
                        <button
                          type="button"
                          onClick={() => addItemToForm('sales')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Add Item
                        </button>
                      </div>
                      {salesForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => {
                                const newItems = [...salesForm.items];
                                newItems[index].itemName = e.target.value;
                                setSalesForm({ ...salesForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...salesForm.items];
                                newItems[index].quantity = e.target.value;
                                setSalesForm({ ...salesForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const newItems = [...salesForm.items];
                                newItems[index].unit = e.target.value;
                                setSalesForm({ ...salesForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="qtl">Quintals</option>
                              <option value="kg">Kilograms</option>
                              <option value="bag">Bags</option>
                              <option value="piece">Pieces</option>
                              <option value="liter">Liters</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => {
                                const newItems = [...salesForm.items];
                                newItems[index].rate = e.target.value;
                                setSalesForm({ ...salesForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                            <select
                              value={item.gstRate}
                              onChange={(e) => {
                                const newItems = [...salesForm.items];
                                newItems[index].gstRate = e.target.value;
                                setSalesForm({ ...salesForm, items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            {salesForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemFromForm('sales', index)}
                                className="text-red-600 hover:text-red-800 p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Calculation */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-right space-y-2">
                        {(() => {
                          const { subtotal, gstAmount, totalAmount } = calculateFormTotal(salesForm.items);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>GST Amount:</span>
                                <span>{formatCurrency(gstAmount)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(totalAmount)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'vendors' && (
                  <form onSubmit={handleVendorSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                        <input
                          type="text"
                          value={vendorForm.name}
                          onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={vendorForm.phone}
                          onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={vendorForm.email}
                          onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                        <input
                          type="text"
                          value={vendorForm.gstNumber}
                          onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                        <input
                          type="text"
                          value={vendorForm.panNumber}
                          onChange={(e) => setVendorForm({ ...vendorForm, panNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                        <input
                          type="number"
                          value={vendorForm.paymentTerms}
                          onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={vendorForm.address}
                        onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={vendorForm.notes}
                        onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayablesReceivables;