import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Edit, Save, X, Trash2, FileText, Users, IndianRupee, Calendar, AlertCircle, Truck, Package } from 'lucide-react';
import { Purchase, PurchasePayment, SalesRecord, SalesPayment, Vendor, FCIConsignment, LorryFreight } from '../types';
import { formatCurrency, formatDecimal, calculateDaysDue } from '../utils/calculations';
import { 
  savePurchases, loadPurchases, savePurchasePayments, loadPurchasePayments,
  saveSalesRecords, loadSalesRecords, saveSalesPayments, loadSalesPayments,
  saveVendors, loadVendors, loadFCIConsignments, saveLorryFreights, loadLorryFreights
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const SalesPurchases: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'freight' | 'vendors'>('purchases');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasePayments, setPurchasePayments] = useState<PurchasePayment[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [salesPayments, setSalesPayments] = useState<SalesPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fciConsignments, setFciConsignments] = useState<FCIConsignment[]>([]);
  const [lorryFreights, setLorryFreights] = useState<LorryFreight[]>([]);
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
    items: [{ itemName: '', quantity: '', unit: 'kg', rate: '', gstRate: '18' }],
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

  const [freightForm, setFreightForm] = useState({
    consignmentId: '',
    transporterName: '',
    freightPerMT: '',
    advancePaid: '',
    deductions: [{ description: '', amount: '' }],
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    setPurchases(loadPurchases());
    setPurchasePayments(loadPurchasePayments());
    setSalesRecords(loadSalesRecords());
    setSalesPayments(loadSalesPayments());
    setVendors(loadVendors());
    setFciConsignments(loadFCIConsignments());
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

  useEffect(() => {
    if (lorryFreights.length > 0) saveLorryFreights(lorryFreights);
  }, [lorryFreights]);

  // Calculate summary stats
  const totalPurchases = useMemo(() => purchases.reduce((sum, p) => sum + p.totalAmount, 0), [purchases]);
  const totalSales = useMemo(() => salesRecords.reduce((sum, s) => sum + s.totalAmount, 0), [salesRecords]);
  const purchaseOutstanding = useMemo(() => purchases.reduce((sum, p) => sum + p.balanceAmount, 0), [purchases]);
  const salesOutstanding = useMemo(() => salesRecords.reduce((sum, s) => sum + s.balanceAmount, 0), [salesRecords]);

  // Get overdue items
  const overduePurchases = useMemo(() => 
    purchases.filter(p => p.balanceAmount > 0 && calculateDaysDue(p.dueDate) > 0), 
    [purchases]
  );
  
  const overdueSales = useMemo(() => 
    salesRecords.filter(s => s.balanceAmount > 0 && calculateDaysDue(s.dueDate) > 0), 
    [salesRecords]
  );

  // Available consignments for freight
  const availableConsignments = useMemo(() => 
    fciConsignments.filter(c => !lorryFreights.some(f => f.consignmentId === c.id)), 
    [fciConsignments, lorryFreights]
  );

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = purchaseForm.items.map(item => {
      const quantity = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const gstRate = parseFloat(item.gstRate);
      const amount = quantity * rate;
      const gstAmount = (amount * gstRate) / 100;
      
      return {
        id: Date.now().toString() + Math.random(),
        itemName: item.itemName,
        description: '',
        quantity,
        unit: item.unit,
        rate,
        gstRate,
        amount,
        gstAmount,
        totalAmount: amount + gstAmount
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;

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
      dueDate: new Date(new Date(purchaseForm.billDate).getTime() + parseInt(purchaseForm.paymentTerms) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      items: [{ itemName: '', quantity: '', unit: 'kg', rate: '', gstRate: '18' }],
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleSalesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = salesForm.items.map(item => {
      const quantity = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const gstRate = parseFloat(item.gstRate);
      const amount = quantity * rate;
      const gstAmount = (amount * gstRate) / 100;
      
      return {
        id: Date.now().toString() + Math.random(),
        itemName: item.itemName,
        description: '',
        quantity,
        unit: item.unit,
        rate,
        gstRate,
        amount,
        gstAmount,
        totalAmount: amount + gstAmount
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;

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
      dueDate: new Date(new Date(salesForm.invoiceDate).getTime() + parseInt(salesForm.paymentTerms) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  const handleFreightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const consignment = fciConsignments.find(c => c.id === freightForm.consignmentId);
    if (!consignment) return;

    const quantityMT = (consignment.riceQuantity + (consignment.frkQuantity / 100)) / 10; // Convert to MT
    const freightPerMT = parseFloat(freightForm.freightPerMT);
    const grossFreightAmount = quantityMT * freightPerMT;
    
    const deductions = freightForm.deductions
      .filter(d => d.description && d.amount)
      .map(d => ({
        id: Date.now().toString() + Math.random(),
        description: d.description,
        amount: parseFloat(d.amount)
      }));
    
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netFreightAmount = grossFreightAmount - totalDeductions;
    const advancePaid = parseFloat(freightForm.advancePaid) || 0;
    const balanceAmount = netFreightAmount - advancePaid;

    const newFreight: LorryFreight = {
      id: Date.now().toString(),
      consignmentId: consignment.id,
      ackNumber: consignment.ackNumber,
      lorryNumber: consignment.lorryNumber || '',
      transporterName: freightForm.transporterName,
      quantityMT,
      freightPerMT,
      grossFreightAmount,
      deductions,
      netFreightAmount,
      advancePaid,
      balanceAmount,
      dispatchDate: consignment.consignmentDate,
      paymentStatus: balanceAmount <= 0 ? 'fully-paid' : advancePaid > 0 ? 'advance-paid' : 'pending',
      notes: freightForm.notes
    };

    setLorryFreights([...lorryFreights, newFreight]);
    setFreightForm({
      consignmentId: '',
      transporterName: '',
      freightPerMT: '',
      advancePaid: '',
      deductions: [{ description: '', amount: '' }],
      notes: ''
    });
    setShowAddForm(false);
  };

  const addPurchaseItem = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [...purchaseForm.items, { itemName: '', quantity: '', unit: 'kg', rate: '', gstRate: '18' }]
    });
  };

  const addSalesItem = () => {
    setSalesForm({
      ...salesForm,
      items: [...salesForm.items, { itemName: '', quantity: '', unit: 'qtl', rate: '', gstRate: '5' }]
    });
  };

  const addDeduction = () => {
    setFreightForm({
      ...freightForm,
      deductions: [...freightForm.deductions, { description: '', amount: '' }]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'fully-paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
      case 'advance-paid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const tabs = [
    { id: 'purchases', label: 'Purchases', icon: FileText },
    { id: 'sales', label: 'Sales', icon: IndianRupee },
    { id: 'freight', label: 'Lorry Freight', icon: Truck },
    { id: 'vendors', label: 'Vendors', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales & Purchases</h1>
            <p className="text-gray-600 mt-2">Manage sales, purchases, freight and vendor relationships</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'purchases' ? 'Purchase' : activeTab === 'sales' ? 'Sale' : activeTab === 'freight' ? 'Freight' : 'Vendor'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Purchases"
            value={formatCurrency(totalPurchases)}
            subtitle={`Outstanding: ${formatCurrency(purchaseOutstanding)}`}
            icon={<FileText className="h-6 w-6" />}
            color="from-red-500 to-red-600"
          />
          <StatsCard
            title="Total Sales"
            value={formatCurrency(totalSales)}
            subtitle={`Outstanding: ${formatCurrency(salesOutstanding)}`}
            icon={<IndianRupee className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Overdue Purchases"
            value={overduePurchases.length.toString()}
            subtitle={`Amount: ${formatCurrency(overduePurchases.reduce((sum, p) => sum + p.balanceAmount, 0))}`}
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Overdue Sales"
            value={overdueSales.length.toString()}
            subtitle={`Amount: ${formatCurrency(overdueSales.reduce((sum, s) => sum + s.balanceAmount, 0))}`}
            icon={<Calendar className="h-6 w-6" />}
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {purchases.map((purchase) => {
                          const daysDue = calculateDaysDue(purchase.dueDate);
                          return (
                            <tr key={purchase.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {purchase.billNumber}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(purchase.billDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {purchase.vendorName}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {formatCurrency(purchase.totalAmount)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                {formatCurrency(purchase.balanceAmount)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(purchase.paymentStatus)}`}>
                                  {purchase.paymentStatus}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <div className={`${daysDue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                  {new Date(purchase.dueDate).toLocaleDateString()}
                                  {daysDue > 0 && (
                                    <div className="text-xs text-red-500">
                                      {daysDue} days overdue
                                    </div>
                                  )}
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesRecords.map((sale) => {
                          const daysDue = calculateDaysDue(sale.dueDate);
                          return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                {sale.invoiceNumber}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(sale.invoiceDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {sale.partyName}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {formatCurrency(sale.totalAmount)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                {formatCurrency(sale.balanceAmount)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.paymentStatus)}`}>
                                  {sale.paymentStatus}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <div className={`${daysDue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                  {new Date(sale.dueDate).toLocaleDateString()}
                                  {daysDue > 0 && (
                                    <div className="text-xs text-red-500">
                                      {daysDue} days overdue
                                    </div>
                                  )}
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

            {activeTab === 'freight' && (
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (MT)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate/MT</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lorryFreights.map((freight) => (
                          <tr key={freight.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {freight.ackNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {freight.lorryNumber}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {freight.transporterName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(freight.quantityMT, 2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(freight.freightPerMT)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(freight.netFreightAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                              {formatCurrency(freight.balanceAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(freight.paymentStatus)}`}>
                                {freight.paymentStatus.replace('-', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vendors.map((vendor) => {
                          const vendorOutstanding = purchases
                            .filter(p => p.vendorName === vendor.name)
                            .reduce((sum, p) => sum + p.balanceAmount, 0);
                          
                          return (
                            <tr key={vendor.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {vendor.name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {vendor.phone}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {vendor.gstNumber || '-'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {vendor.paymentTerms} days
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                {formatCurrency(vendorOutstanding)}
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
                  Add {activeTab === 'purchases' ? 'Purchase' : activeTab === 'sales' ? 'Sale' : activeTab === 'freight' ? 'Freight' : 'Vendor'}
                </h3>
                
                {activeTab === 'purchases' && (
                  <form onSubmit={handlePurchaseSubmit} className="space-y-4">
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
                          <option value="gst">GST Bill</option>
                          <option value="cash">Cash Bill</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Items</label>
                      {purchaseForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].itemName = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].quantity = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].unit = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="kg">kg</option>
                            <option value="qtl">qtl</option>
                            <option value="piece">piece</option>
                            <option value="hour">hour</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].rate = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <select
                            value={item.gstRate}
                            onChange={(e) => {
                              const newItems = [...purchaseForm.items];
                              newItems[index].gstRate = e.target.value;
                              setPurchaseForm({ ...purchaseForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPurchaseItem}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Item
                      </button>
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
                  <form onSubmit={handleSalesSubmit} className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lorry Number</label>
                        <input
                          type="text"
                          value={salesForm.lorryNumber}
                          onChange={(e) => setSalesForm({ ...salesForm, lorryNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Items</label>
                      {salesForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) => {
                              const newItems = [...salesForm.items];
                              newItems[index].itemName = e.target.value;
                              setSalesForm({ ...salesForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...salesForm.items];
                              newItems[index].quantity = e.target.value;
                              setSalesForm({ ...salesForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => {
                              const newItems = [...salesForm.items];
                              newItems[index].unit = e.target.value;
                              setSalesForm({ ...salesForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="qtl">qtl</option>
                            <option value="kg">kg</option>
                            <option value="bag">bag</option>
                            <option value="piece">piece</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => {
                              const newItems = [...salesForm.items];
                              newItems[index].rate = e.target.value;
                              setSalesForm({ ...salesForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <select
                            value={item.gstRate}
                            onChange={(e) => {
                              const newItems = [...salesForm.items];
                              newItems[index].gstRate = e.target.value;
                              setSalesForm({ ...salesForm, items: newItems });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSalesItem}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Item
                      </button>
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

                {activeTab === 'freight' && (
                  <form onSubmit={handleFreightSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Consignment</label>
                        <select
                          value={freightForm.consignmentId}
                          onChange={(e) => setFreightForm({ ...freightForm, consignmentId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select FCI Consignment</option>
                          {availableConsignments.map(consignment => (
                            <option key={consignment.id} value={consignment.id}>
                              {consignment.ackNumber} - {consignment.lorryNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
                        <input
                          type="text"
                          value={freightForm.transporterName}
                          onChange={(e) => setFreightForm({ ...freightForm, transporterName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Freight Per MT (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={freightForm.freightPerMT}
                          onChange={(e) => setFreightForm({ ...freightForm, freightPerMT: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={freightForm.advancePaid}
                          onChange={(e) => setFreightForm({ ...freightForm, advancePaid: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Deductions</label>
                      {freightForm.deductions.map((deduction, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Deduction description"
                            value={deduction.description}
                            onChange={(e) => {
                              const newDeductions = [...freightForm.deductions];
                              newDeductions[index].description = e.target.value;
                              setFreightForm({ ...freightForm, deductions: newDeductions });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={deduction.amount}
                            onChange={(e) => {
                              const newDeductions = [...freightForm.deductions];
                              newDeductions[index].amount = e.target.value;
                              setFreightForm({ ...freightForm, deductions: newDeductions });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDeduction}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Deduction
                      </button>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Freight
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                        <input
                          type="text"
                          value={vendorForm.gstNumber}
                          onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
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

export default SalesPurchases;