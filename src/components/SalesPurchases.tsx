import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, Trash2, Truck, AlertTriangle, CheckCircle, Clock, FileText, IndianRupee, Calendar, Package } from 'lucide-react';
import { Purchase, PurchasePayment, SalesRecord, SalesPayment, Vendor, LorryFreight, FCIConsignment } from '../types';
import { formatCurrency, formatDecimal, calculateDaysDue } from '../utils/calculations';
import { 
  savePurchases, loadPurchases, savePurchasePayments, loadPurchasePayments,
  saveSalesRecords, loadSalesRecords, saveSalesPayments, loadSalesPayments,
  saveVendors, loadVendors, saveLorryFreights, loadLorryFreights,
  loadFCIConsignments
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const SalesPurchases: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'lorry-freight' | 'vendors'>('purchases');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasePayments, setPurchasePayments] = useState<PurchasePayment[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [salesPayments, setSalesPayments] = useState<SalesPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
  const [fciConsignments, setFciConsignments] = useState<FCIConsignment[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    notes: '',
    items: [{ id: '1', itemName: '', description: '', quantity: '', unit: 'kg', rate: '', gstRate: '18', amount: 0, gstAmount: 0, totalAmount: 0 }]
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
    notes: '',
    items: [{ id: '1', itemName: '', description: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5', amount: 0, gstAmount: 0, totalAmount: 0 }]
  });

  const [lorryFreightForm, setLorryFreightForm] = useState({
    consignmentId: '',
    transporterName: '',
    freightPerMT: '',
    advancePaid: '',
    deductions: [{ id: '1', description: '', amount: '' }],
    paymentMethod: 'cash' as 'cash' | 'cheque' | 'bank-transfer' | 'upi' | 'other',
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

  // Load data on component mount
  useEffect(() => {
    setPurchases(loadPurchases());
    setPurchasePayments(loadPurchasePayments());
    setSalesRecords(loadSalesRecords());
    setSalesPayments(loadSalesPayments());
    setVendors(loadVendors());
    setLorryFreights(loadLorryFreights());
    setFciConsignments(loadFCIConsignments());
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

  useEffect(() => {
    if (lorryFreights.length > 0) saveLorryFreights(lorryFreights);
  }, [lorryFreights]);

  // Calculate summary stats
  const totalPurchases = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0), [purchases]);
  const totalPurchasesPaid = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0), [purchases]);
  const totalPurchasesOutstanding = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.balanceAmount, 0), [purchases]);
  const overduePurchases = useMemo(() => purchases.filter(p => p.balanceAmount > 0 && calculateDaysDue(p.dueDate) > 0).length, [purchases]);

  const totalSales = useMemo(() => salesRecords.reduce((sum, sale) => sum + sale.totalAmount, 0), [salesRecords]);
  const totalSalesReceived = useMemo(() => salesRecords.reduce((sum, sale) => sum + sale.paidAmount, 0), [salesRecords]);
  const totalSalesOutstanding = useMemo(() => salesRecords.reduce((sum, sale) => sum + sale.balanceAmount, 0), [salesRecords]);
  const overdueSales = useMemo(() => salesRecords.filter(s => s.balanceAmount > 0 && calculateDaysDue(s.dueDate) > 0).length, [salesRecords]);

  const totalFreightAmount = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.grossFreightAmount, 0), [lorryFreights]);
  const totalFreightPaid = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.advancePaid, 0), [lorryFreights]);
  const totalFreightOutstanding = useMemo(() => lorryFreights.reduce((sum, freight) => sum + freight.balanceAmount, 0), [lorryFreights]);

  // Available FCI consignments for lorry freight
  const availableConsignments = useMemo(() => {
    const usedConsignmentIds = lorryFreights.map(f => f.consignmentId);
    return fciConsignments.filter(c => !usedConsignmentIds.includes(c.id));
  }, [fciConsignments, lorryFreights]);

  // Calculate item totals
  const calculateItemTotals = (items: any[]) => {
    return items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;
      
      const amount = quantity * rate;
      const gstAmount = (amount * gstRate) / 100;
      const totalAmount = amount + gstAmount;
      
      return { ...item, amount, gstAmount, totalAmount };
    });
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsWithTotals = calculateItemTotals(purchaseForm.items);
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = itemsWithTotals.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;
    
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
      items: itemsWithTotals,
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
      billNumber: '', billDate: '', vendorName: '', vendorGST: '', vendorAddress: '', vendorPhone: '',
      category: 'gst', paymentTerms: '30', notes: '',
      items: [{ id: '1', itemName: '', description: '', quantity: '', unit: 'kg', rate: '', gstRate: '18', amount: 0, gstAmount: 0, totalAmount: 0 }]
    });
    setShowAddForm(false);
  };

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsWithTotals = calculateItemTotals(salesForm.items);
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = itemsWithTotals.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;
    
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
      items: itemsWithTotals,
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
      invoiceNumber: '', invoiceDate: '', partyName: '', partyGST: '', partyAddress: '', partyPhone: '',
      lorryNumber: '', paymentTerms: '30', notes: '',
      items: [{ id: '1', itemName: '', description: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5', amount: 0, gstAmount: 0, totalAmount: 0 }]
    });
    setShowAddForm(false);
  };

  const handleLorryFreightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedConsignment = fciConsignments.find(c => c.id === lorryFreightForm.consignmentId);
    if (!selectedConsignment) return;

    const quantityMT = selectedConsignment.riceQuantity / 10; // Convert quintals to MT
    const freightPerMT = parseFloat(lorryFreightForm.freightPerMT);
    const grossFreightAmount = quantityMT * freightPerMT;
    const advancePaid = parseFloat(lorryFreightForm.advancePaid) || 0;
    
    const deductions = lorryFreightForm.deductions
      .filter(d => d.description && d.amount)
      .map(d => ({ ...d, amount: parseFloat(d.amount) }));
    
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netFreightAmount = grossFreightAmount - totalDeductions;
    const balanceAmount = netFreightAmount - advancePaid;

    const newLorryFreight: LorryFreight = {
      id: Date.now().toString(),
      consignmentId: lorryFreightForm.consignmentId,
      ackNumber: selectedConsignment.ackNumber,
      lorryNumber: selectedConsignment.lorryNumber || '',
      transporterName: lorryFreightForm.transporterName,
      quantityMT,
      freightPerMT,
      grossFreightAmount,
      deductions,
      netFreightAmount,
      advancePaid,
      balanceAmount,
      dispatchDate: selectedConsignment.consignmentDate,
      paymentStatus: balanceAmount <= 0 ? 'fully-paid' : advancePaid > 0 ? 'advance-paid' : 'pending',
      notes: lorryFreightForm.notes
    };

    setLorryFreights([...lorryFreights, newLorryFreight]);
    setLorryFreightForm({
      consignmentId: '', transporterName: '', freightPerMT: '', advancePaid: '',
      deductions: [{ id: '1', description: '', amount: '' }],
      paymentMethod: 'cash', notes: ''
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
      name: '', address: '', phone: '', email: '', gstNumber: '', panNumber: '',
      paymentTerms: '30', notes: ''
    });
    setShowAddForm(false);
  };

  const addPurchaseItem = () => {
    const newItem = {
      id: Date.now().toString(),
      itemName: '', description: '', quantity: '', unit: 'kg', rate: '', gstRate: '18',
      amount: 0, gstAmount: 0, totalAmount: 0
    };
    setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, newItem] });
  };

  const addSalesItem = () => {
    const newItem = {
      id: Date.now().toString(),
      itemName: '', description: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5',
      amount: 0, gstAmount: 0, totalAmount: 0
    };
    setSalesForm({ ...salesForm, items: [...salesForm.items, newItem] });
  };

  const addDeduction = () => {
    const newDeduction = { id: Date.now().toString(), description: '', amount: '' };
    setLorryFreightForm({ ...lorryFreightForm, deductions: [...lorryFreightForm.deductions, newDeduction] });
  };

  const getPaymentStatusColor = (status: string, dueDate: string, balanceAmount: number) => {
    if (balanceAmount <= 0) return 'bg-green-100 text-green-800 border-green-200';
    if (calculateDaysDue(dueDate) > 0) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPaymentStatusIcon = (status: string, dueDate: string, balanceAmount: number) => {
    if (balanceAmount <= 0) return <CheckCircle className="h-4 w-4" />;
    if (calculateDaysDue(dueDate) > 0) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const tabs = [
    { id: 'purchases', label: 'Purchases', icon: FileText },
    { id: 'sales', label: 'Sales', icon: IndianRupee },
    { id: 'lorry-freight', label: 'Lorry Freight', icon: Truck },
    { id: 'vendors', label: 'Vendors', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales & Purchases</h1>
            <p className="text-gray-600 mt-2">Manage sales, purchases, lorry freight and vendor relationships</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'purchases' ? 'Purchase' : activeTab === 'sales' ? 'Sale' : activeTab === 'lorry-freight' ? 'Freight' : 'Vendor'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activeTab === 'purchases' && (
            <>
              <StatsCard
                title="Total Purchases"
                value={formatCurrency(totalPurchases)}
                icon={<FileText className="h-6 w-6" />}
                color="from-red-500 to-red-600"
              />
              <StatsCard
                title="Amount Paid"
                value={formatCurrency(totalPurchasesPaid)}
                icon={<CheckCircle className="h-6 w-6" />}
                color="from-green-500 to-green-600"
              />
              <StatsCard
                title="Outstanding"
                value={formatCurrency(totalPurchasesOutstanding)}
                subtitle={`${overduePurchases} overdue`}
                icon={<AlertTriangle className="h-6 w-6" />}
                color="from-orange-500 to-orange-600"
              />
              <StatsCard
                title="Total Bills"
                value={purchases.length.toString()}
                subtitle={`${vendors.length} vendors`}
                icon={<Package className="h-6 w-6" />}
                color="from-blue-500 to-blue-600"
              />
            </>
          )}

          {activeTab === 'sales' && (
            <>
              <StatsCard
                title="Total Sales"
                value={formatCurrency(totalSales)}
                icon={<IndianRupee className="h-6 w-6" />}
                color="from-green-500 to-green-600"
              />
              <StatsCard
                title="Amount Received"
                value={formatCurrency(totalSalesReceived)}
                icon={<CheckCircle className="h-6 w-6" />}
                color="from-blue-500 to-blue-600"
              />
              <StatsCard
                title="Outstanding"
                value={formatCurrency(totalSalesOutstanding)}
                subtitle={`${overdueSales} overdue`}
                icon={<AlertTriangle className="h-6 w-6" />}
                color="from-orange-500 to-orange-600"
              />
              <StatsCard
                title="Total Invoices"
                value={salesRecords.length.toString()}
                icon={<FileText className="h-6 w-6" />}
                color="from-purple-500 to-purple-600"
              />
            </>
          )}

          {activeTab === 'lorry-freight' && (
            <>
              <StatsCard
                title="Total Freight"
                value={formatCurrency(totalFreightAmount)}
                icon={<Truck className="h-6 w-6" />}
                color="from-blue-500 to-blue-600"
              />
              <StatsCard
                title="Advance Paid"
                value={formatCurrency(totalFreightPaid)}
                icon={<CheckCircle className="h-6 w-6" />}
                color="from-green-500 to-green-600"
              />
              <StatsCard
                title="Balance Due"
                value={formatCurrency(totalFreightOutstanding)}
                icon={<Clock className="h-6 w-6" />}
                color="from-orange-500 to-orange-600"
              />
              <StatsCard
                title="Total Trips"
                value={lorryFreights.length.toString()}
                subtitle={`${availableConsignments.length} pending`}
                icon={<Package className="h-6 w-6" />}
                color="from-purple-500 to-purple-600"
              />
            </>
          )}
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
            {activeTab === 'purchases' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Records</h3>
                {purchases.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No purchase records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Details</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchases.map((purchase) => {
                          const daysDue = calculateDaysDue(purchase.dueDate);
                          return (
                            <tr key={purchase.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{purchase.billNumber}</div>
                                  <div className="text-sm text-gray-500">{new Date(purchase.billDate).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-400">{purchase.category.toUpperCase()}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">{purchase.vendorName}</div>
                                {purchase.vendorGST && (
                                  <div className="text-xs text-gray-500">GST: {purchase.vendorGST}</div>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{formatCurrency(purchase.totalAmount)}</div>
                                <div className="text-xs text-green-600">Paid: {formatCurrency(purchase.paidAmount)}</div>
                                <div className="text-xs text-red-600">Due: {formatCurrency(purchase.balanceAmount)}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(purchase.paymentStatus, purchase.dueDate, purchase.balanceAmount)}`}>
                                  {getPaymentStatusIcon(purchase.paymentStatus, purchase.dueDate, purchase.balanceAmount)}
                                  <span className="ml-1">
                                    {purchase.balanceAmount <= 0 ? 'Paid' : daysDue > 0 ? `Overdue ${daysDue}d` : 'Pending'}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(purchase.dueDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => setShowDeleteConfirm(purchase.id)}
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

            {activeTab === 'lorry-freight' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lorry Freight Management</h3>
                {lorryFreights.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No freight records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK/Lorry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freight Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.map((freight) => (
                          <tr key={freight.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-blue-600">{freight.ackNumber}</div>
                                <div className="text-sm text-gray-500">{freight.lorryNumber}</div>
                                <div className="text-xs text-gray-400">{new Date(freight.dispatchDate).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{freight.transporterName}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatDecimal(freight.quantityMT)} MT</div>
                              <div className="text-xs text-gray-500">@ {formatCurrency(freight.freightPerMT)}/MT</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(freight.grossFreightAmount)}</div>
                              <div className="text-xs text-green-600">Advance: {formatCurrency(freight.advancePaid)}</div>
                              <div className="text-xs text-red-600">Balance: {formatCurrency(freight.balanceAmount)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                freight.paymentStatus === 'fully-paid' ? 'bg-green-100 text-green-800 border-green-200' :
                                freight.paymentStatus === 'advance-paid' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {freight.paymentStatus === 'fully-paid' ? <CheckCircle className="h-4 w-4" /> :
                                 freight.paymentStatus === 'advance-paid' ? <Clock className="h-4 w-4" /> :
                                 <AlertTriangle className="h-4 w-4" />}
                                <span className="ml-1 capitalize">{freight.paymentStatus.replace('-', ' ')}</span>
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => setShowDeleteConfirm(freight.id)}
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
          </div>
        </div>

        {/* Add Forms */}
        {showAddForm && activeTab === 'lorry-freight' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Lorry Freight</h3>
                <form onSubmit={handleLorryFreightSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FCI Consignment</label>
                    <select
                      value={lorryFreightForm.consignmentId}
                      onChange={(e) => setLorryFreightForm({ ...lorryFreightForm, consignmentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Consignment</option>
                      {availableConsignments.map(consignment => (
                        <option key={consignment.id} value={consignment.id}>
                          {consignment.ackNumber} - {consignment.lorryNumber} ({formatDecimal(consignment.riceQuantity)} Qtl)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
                      <input
                        type="text"
                        value={lorryFreightForm.transporterName}
                        onChange={(e) => setLorryFreightForm({ ...lorryFreightForm, transporterName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Freight Rate (₹/MT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lorryFreightForm.freightPerMT}
                        onChange={(e) => setLorryFreightForm({ ...lorryFreightForm, freightPerMT: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lorryFreightForm.advancePaid}
                      onChange={(e) => setLorryFreightForm({ ...lorryFreightForm, advancePaid: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Deductions</label>
                      <button
                        type="button"
                        onClick={addDeduction}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Deduction
                      </button>
                    </div>
                    {lorryFreightForm.deductions.map((deduction, index) => (
                      <div key={deduction.id} className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={deduction.description}
                          onChange={(e) => {
                            const newDeductions = [...lorryFreightForm.deductions];
                            newDeductions[index].description = e.target.value;
                            setLorryFreightForm({ ...lorryFreightForm, deductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={deduction.amount}
                          onChange={(e) => {
                            const newDeductions = [...lorryFreightForm.deductions];
                            newDeductions[index].amount = e.target.value;
                            setLorryFreightForm({ ...lorryFreightForm, deductions: newDeductions });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={lorryFreightForm.notes}
                      onChange={(e) => setLorryFreightForm({ ...lorryFreightForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Freight Record
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
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this record? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (activeTab === 'purchases') {
                        setPurchases(purchases.filter(p => p.id !== showDeleteConfirm));
                      } else if (activeTab === 'lorry-freight') {
                        setLorryFreights(lorryFreights.filter(f => f.id !== showDeleteConfirm));
                      }
                      setShowDeleteConfirm(null);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPurchases;