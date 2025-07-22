import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Package, TrendingUp, Users, IndianRupee, Calendar, Download, Edit, Save, X, Trash2, Factory, BarChart3, Eye, EyeOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ByProduct, ByProductProduction, ByProductSale, ByProductSaleItem, ByProductPayment, ByProductStock, RiceProduction } from '../types';
import { formatDecimal, formatCurrency, formatWeight, calculateDaysDue } from '../utils/calculations';
import { 
  saveByProducts, loadByProducts, saveByProductProductions, loadByProductProductions,
  saveByProductSales, loadByProductSales, saveByProductPayments, loadByProductPayments,
  loadRiceProductions
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StreamlinedByProducts: React.FC = () => {
  const [byProducts, setByProducts] = useState<ByProduct[]>([]);
  const [byProductProductions, setByProductProductions] = useState<ByProductProduction[]>([]);
  const [byProductSales, setByProductSales] = useState<ByProductSale[]>([]);
  const [byProductPayments, setByProductPayments] = useState<ByProductPayment[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'sales' | 'payments'>('dashboard');
  const [showAddProductionForm, setShowAddProductionForm] = useState(false);
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [editingProduction, setEditingProduction] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [productionForm, setProductionForm] = useState({
    riceProductionId: '',
    husk: '',
    branBoiled: '',
    branRaw: '',
    brokenRice: '',
    param: '',
    rejectionRice: '',
    reSortedRice: '',
    ash: '',
    notes: ''
  });

  const [saleForm, setSaleForm] = useState({
    saleDate: '',
    invoiceNumber: '',
    partyName: '',
    partyPhone: '',
    partyAddress: '',
    paymentTerms: '30',
    notes: '',
    items: [] as ByProductSaleItem[]
  });

  const [paymentForm, setPaymentForm] = useState({
    saleId: '',
    amount: '',
    paymentDate: '',
    paymentMethod: 'cash' as ByProductPayment['paymentMethod'],
    referenceNumber: '',
    notes: ''
  });

  const [newItem, setNewItem] = useState({
    productType: 'bran-boiled' as ByProductSaleItem['productType'],
    productName: '',
    quantity: '',
    rate: '',
    gstRate: '5'
  });

  // Load data on component mount
  useEffect(() => {
    setByProducts(loadByProducts());
    setByProductProductions(loadByProductProductions());
    setByProductSales(loadByProductSales());
    setByProductPayments(loadByProductPayments());
    setRiceProductions(loadRiceProductions());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (byProductProductions.length > 0) {
      saveByProductProductions(byProductProductions);
    }
  }, [byProductProductions]);

  useEffect(() => {
    if (byProductSales.length > 0) {
      saveByProductSales(byProductSales);
    }
  }, [byProductSales]);

  useEffect(() => {
    if (byProductPayments.length > 0) {
      saveByProductPayments(byProductPayments);
    }
  }, [byProductPayments]);

  // Calculate stock levels
  const stockLevels = useMemo((): ByProductStock[] => {
    const productTypes = ['husk', 'bran-boiled', 'bran-raw', 'broken-rice', 'param', 'rejection-rice', 're-sorted-rice', 'ash'] as const;
    
    return productTypes.map(type => {
      // Calculate total produced
      const totalProduced = byProductProductions.reduce((sum, production) => {
        switch (type) {
          case 'husk': return sum + production.byProducts.husk;
          case 'bran-boiled': return sum + production.byProducts.branBoiled;
          case 'bran-raw': return sum + production.byProducts.branRaw;
          case 'broken-rice': return sum + production.byProducts.brokenRice;
          case 'param': return sum + production.byProducts.param;
          case 'rejection-rice': return sum + production.byProducts.rejectionRice;
          case 're-sorted-rice': return sum + production.byProducts.reSortedRice;
          case 'ash': return sum + production.byProducts.ash;
          default: return sum;
        }
      }, 0);

      // Calculate total sold and revenue
      let totalSold = 0;
      let totalRevenue = 0;
      let lastSaleDate: string | undefined;

      byProductSales.forEach(sale => {
        sale.items.forEach(item => {
          if (item.productType === type) {
            totalSold += item.quantity;
            totalRevenue += item.totalAmount;
            if (!lastSaleDate || sale.saleDate > lastSaleDate) {
              lastSaleDate = sale.saleDate;
            }
          }
        });
      });

      const currentStock = totalProduced - totalSold;
      const averageRate = totalSold > 0 ? totalRevenue / totalSold : 0;

      return {
        productType: type,
        productName: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        totalProduced,
        totalSold,
        currentStock,
        averageRate,
        totalRevenue,
        lastSaleDate
      };
    });
  }, [byProductProductions, byProductSales]);

  // Calculate summary stats
  const totalProduction = useMemo(() => 
    stockLevels.reduce((sum, stock) => sum + stock.totalProduced, 0), 
    [stockLevels]
  );
  
  const totalRevenue = useMemo(() => 
    stockLevels.reduce((sum, stock) => sum + stock.totalRevenue, 0), 
    [stockLevels]
  );

  const totalCurrentStock = useMemo(() => 
    stockLevels.reduce((sum, stock) => sum + stock.currentStock, 0), 
    [stockLevels]
  );

  const pendingPayments = useMemo(() => 
    byProductSales.reduce((sum, sale) => sum + sale.balanceAmount, 0), 
    [byProductSales]
  );

  const overdueSales = useMemo(() => 
    byProductSales.filter(sale => 
      sale.paymentStatus !== 'paid' && calculateDaysDue(sale.dueDate) > 0
    ).length, 
    [byProductSales]
  );

  // Handle production form submission
  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedRiceProduction = riceProductions.find(rp => rp.id === productionForm.riceProductionId);
    if (!selectedRiceProduction) return;

    const byProducts = {
      husk: parseFloat(productionForm.husk) || 0,
      branBoiled: parseFloat(productionForm.branBoiled) || 0,
      branRaw: parseFloat(productionForm.branRaw) || 0,
      brokenRice: parseFloat(productionForm.brokenRice) || 0,
      param: parseFloat(productionForm.param) || 0,
      rejectionRice: parseFloat(productionForm.rejectionRice) || 0,
      reSortedRice: parseFloat(productionForm.reSortedRice) || 0,
      ash: parseFloat(productionForm.ash) || 0
    };

    const totalByProducts = Object.values(byProducts).reduce((sum, qty) => sum + qty, 0);
    
    // Calculate yields
    const yields = {
      riceYield: (selectedRiceProduction.riceProduced / selectedRiceProduction.paddyUsed) * 100,
      branYield: ((byProducts.branBoiled + byProducts.branRaw) / selectedRiceProduction.paddyUsed) * 100,
      brokenYield: (byProducts.brokenRice / selectedRiceProduction.paddyUsed) * 100,
      huskYield: (byProducts.husk / selectedRiceProduction.paddyUsed) * 100,
      rejectionYield: (byProducts.rejectionRice / selectedRiceProduction.paddyUsed) * 100
    };

    const newProduction: ByProductProduction = {
      id: Date.now().toString(),
      riceProductionId: selectedRiceProduction.id,
      ackNumber: selectedRiceProduction.ackNumber,
      productionDate: selectedRiceProduction.productionDate,
      paddyUsed: selectedRiceProduction.paddyUsed,
      riceProduced: selectedRiceProduction.riceProduced,
      byProducts,
      yields,
      notes: productionForm.notes
    };

    setByProductProductions([...byProductProductions, newProduction]);
    setProductionForm({
      riceProductionId: '',
      husk: '',
      branBoiled: '',
      branRaw: '',
      brokenRice: '',
      param: '',
      rejectionRice: '',
      reSortedRice: '',
      ash: '',
      notes: ''
    });
    setShowAddProductionForm(false);
  };

  // Handle sale form submission
  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleForm.items.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }

    const subtotal = saleForm.items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = saleForm.items.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(saleForm.paymentTerms));

    const newSale: ByProductSale = {
      id: Date.now().toString(),
      saleDate: saleForm.saleDate,
      invoiceNumber: saleForm.invoiceNumber,
      partyName: saleForm.partyName,
      partyPhone: saleForm.partyPhone,
      partyAddress: saleForm.partyAddress,
      items: saleForm.items,
      subtotal,
      gstAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'pending',
      paymentTerms: parseInt(saleForm.paymentTerms),
      dueDate: dueDate.toISOString().split('T')[0],
      notes: saleForm.notes
    };

    setByProductSales([...byProductSales, newSale]);
    setSaleForm({
      saleDate: '',
      invoiceNumber: '',
      partyName: '',
      partyPhone: '',
      partyAddress: '',
      paymentTerms: '30',
      notes: '',
      items: []
    });
    setShowAddSaleForm(false);
  };

  // Add item to sale
  const addItemToSale = () => {
    if (!newItem.productName || !newItem.quantity || !newItem.rate) return;

    const quantity = parseFloat(newItem.quantity);
    const rate = parseFloat(newItem.rate);
    const gstRate = parseFloat(newItem.gstRate);
    
    const amount = quantity * rate;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    const item: ByProductSaleItem = {
      id: Date.now().toString(),
      productType: newItem.productType,
      productName: newItem.productName,
      quantity,
      rate,
      gstRate,
      amount,
      gstAmount,
      totalAmount
    };

    setSaleForm({
      ...saleForm,
      items: [...saleForm.items, item]
    });

    setNewItem({
      productType: 'bran-boiled',
      productName: '',
      quantity: '',
      rate: '',
      gstRate: '5'
    });
  };

  // Remove item from sale
  const removeItemFromSale = (itemId: string) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter(item => item.id !== itemId)
    });
  };

  // Handle payment submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentForm.amount);
    const sale = byProductSales.find(s => s.id === paymentForm.saleId);
    if (!sale || amount <= 0 || amount > sale.balanceAmount) return;

    const newPayment: ByProductPayment = {
      id: Date.now().toString(),
      saleId: paymentForm.saleId,
      partyName: sale.partyName,
      amount,
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber,
      notes: paymentForm.notes
    };

    // Update sale payment status
    const updatedSales = byProductSales.map(s => {
      if (s.id === paymentForm.saleId) {
        const newPaidAmount = s.paidAmount + amount;
        const newBalanceAmount = s.totalAmount - newPaidAmount;
        return {
          ...s,
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          paymentStatus: newBalanceAmount <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending') as ByProductSale['paymentStatus']
        };
      }
      return s;
    });

    setByProductSales(updatedSales);
    setByProductPayments([...byProductPayments, newPayment]);
    
    setPaymentForm({
      saleId: '',
      amount: '',
      paymentDate: '',
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: ''
    });
    setShowAddPaymentForm(false);
  };

  // Get available rice productions (not yet processed for by-products)
  const availableRiceProductions = useMemo(() => {
    const processedIds = new Set(byProductProductions.map(bp => bp.riceProductionId));
    return riceProductions.filter(rp => !processedIds.has(rp.id));
  }, [riceProductions, byProductProductions]);

  // Get available stock for sales
  const getAvailableStock = (productType: ByProductSaleItem['productType']) => {
    const stock = stockLevels.find(s => s.productType === productType);
    return stock ? stock.currentStock : 0;
  };

  const exportData = () => {
    const csvContent = [
      ['Product Type', 'Total Produced (Qtl)', 'Total Sold (Qtl)', 'Current Stock (Qtl)', 'Average Rate (₹/Qtl)', 'Total Revenue (₹)', 'Last Sale Date'],
      ...stockLevels.map(stock => [
        stock.productName,
        stock.totalProduced,
        stock.totalSold,
        stock.currentStock,
        stock.averageRate,
        stock.totalRevenue,
        stock.lastSaleDate || 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'by-product-stock-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStockStatusColor = (currentStock: number, totalProduced: number) => {
    const stockPercentage = totalProduced > 0 ? (currentStock / totalProduced) * 100 : 0;
    if (stockPercentage > 50) return 'text-green-600';
    if (stockPercentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">By-Products Management</h1>
            <p className="text-gray-600 mt-2">Track production yields, stock levels, sales and profitability</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Stock Data
            </button>
            {activeTab === 'production' && (
              <button
                onClick={() => setShowAddProductionForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Production Record
              </button>
            )}
            {activeTab === 'sales' && (
              <button
                onClick={() => setShowAddSaleForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sale
              </button>
            )}
            {activeTab === 'payments' && (
              <button
                onClick={() => setShowAddPaymentForm(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Production"
            value={formatWeight(totalProduction)}
            subtitle="All by-products"
            icon={<Factory className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Current Stock"
            value={formatWeight(totalCurrentStock)}
            subtitle="Available inventory"
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="From by-product sales"
            icon={<IndianRupee className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Pending Payments"
            value={formatCurrency(pendingPayments)}
            subtitle={`${overdueSales} overdue invoices`}
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Active Products"
            value={stockLevels.filter(s => s.currentStock > 0).length.toString()}
            subtitle={`${stockLevels.length} total products`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-pink-500 to-pink-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Stock Dashboard', icon: BarChart3 },
                { id: 'production', label: 'Production Records', icon: Factory },
                { id: 'sales', label: 'Sales Management', icon: TrendingUp },
                { id: 'payments', label: 'Payment Tracking', icon: IndianRupee }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">By-Product Stock Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stockLevels.map((stock) => (
                    <div key={stock.productType} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{stock.productName}</h4>
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Produced:</span>
                          <span className="font-semibold text-gray-900">{formatDecimal(stock.totalProduced, 2)} Qtl</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sold:</span>
                          <span className="font-semibold text-gray-900">{formatDecimal(stock.totalSold, 2)} Qtl</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <span className={`font-bold ${getStockStatusColor(stock.currentStock, stock.totalProduced)}`}>
                            {formatDecimal(stock.currentStock, 2)} Qtl
                          </span>
                        </div>
                        
                        {stock.averageRate > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg Rate:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(stock.averageRate)}/Qtl</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Revenue:</span>
                          <span className="font-semibold text-purple-600">{formatCurrency(stock.totalRevenue)}</span>
                        </div>
                        
                        {stock.lastSaleDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Last Sale:</span>
                            <span className="text-sm text-gray-500">{new Date(stock.lastSaleDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stock Level Indicator */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Stock Level</span>
                          <span>{stock.totalProduced > 0 ? Math.round((stock.currentStock / stock.totalProduced) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              stock.totalProduced > 0 && (stock.currentStock / stock.totalProduced) > 0.5 
                                ? 'bg-green-500' 
                                : stock.totalProduced > 0 && (stock.currentStock / stock.totalProduced) > 0.2 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${stock.totalProduced > 0 ? Math.min((stock.currentStock / stock.totalProduced) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'production' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">By-Product Production Records</h3>
                {byProductProductions.length === 0 ? (
                  <div className="text-center py-8">
                    <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No production records yet. Add your first by-product production record.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paddy Used</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rice Produced</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bran</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broken Rice</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Husk</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yields</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {byProductProductions.map((production) => (
                          <tr key={production.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {production.ackNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(production.productionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(production.paddyUsed, 2)} Qtl
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatDecimal(production.riceProduced, 2)} Qtl
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(production.byProducts.branBoiled + production.byProducts.branRaw, 2)} Qtl
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(production.byProducts.brokenRice, 2)} Qtl
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(production.byProducts.husk, 2)} Qtl
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <div>Rice: {formatDecimal(production.yields.riceYield, 1)}%</div>
                                <div>Bran: {formatDecimal(production.yields.branYield, 1)}%</div>
                                <div>Husk: {formatDecimal(production.yields.huskYield, 1)}%</div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">By-Product Sales</h3>
                {byProductSales.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sales records yet. Add your first by-product sale.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {byProductSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {sale.invoiceNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(sale.saleDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate font-medium">{sale.partyName}</div>
                              {sale.partyPhone && (
                                <div className="text-xs text-gray-500">{sale.partyPhone}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                {sale.items.map((item, index) => (
                                  <div key={index} className="text-xs">
                                    {item.productName}: {formatDecimal(item.quantity, 2)} Qtl @ {formatCurrency(item.rate)}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(sale.totalAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatCurrency(sale.balanceAmount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(sale.paymentStatus)}`}>
                                {getPaymentStatusIcon(sale.paymentStatus)}
                                <span className="ml-1 capitalize">{sale.paymentStatus}</span>
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div>{new Date(sale.dueDate).toLocaleDateString()}</div>
                              {calculateDaysDue(sale.dueDate) > 0 && (
                                <div className="text-xs text-red-600">
                                  {calculateDaysDue(sale.dueDate)} days overdue
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Records</h3>
                {byProductPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payment records yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {byProductPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {payment.partyName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {payment.paymentMethod.replace('-', ' ')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {payment.referenceNumber || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              <div className="truncate">{payment.notes || '-'}</div>
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

        {/* Add Production Form */}
        {showAddProductionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add By-Product Production Record</h3>
                <form onSubmit={handleProductionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rice Production Batch</label>
                    <select
                      value={productionForm.riceProductionId}
                      onChange={(e) => setProductionForm({ ...productionForm, riceProductionId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Rice Production Batch</option>
                      {availableRiceProductions.map(rp => (
                        <option key={rp.id} value={rp.id}>
                          {rp.ackNumber} - {new Date(rp.productionDate).toLocaleDateString()} ({formatDecimal(rp.paddyUsed, 2)} Qtl paddy)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Husk (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.husk}
                        onChange={(e) => setProductionForm({ ...productionForm, husk: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bran Boiled (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.branBoiled}
                        onChange={(e) => setProductionForm({ ...productionForm, branBoiled: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bran Raw (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.branRaw}
                        onChange={(e) => setProductionForm({ ...productionForm, branRaw: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Broken Rice (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.brokenRice}
                        onChange={(e) => setProductionForm({ ...productionForm, brokenRice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Param (Small Broken) (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.param}
                        onChange={(e) => setProductionForm({ ...productionForm, param: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Rice (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.rejectionRice}
                        onChange={(e) => setProductionForm({ ...productionForm, rejectionRice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Re-sorted Rice (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.reSortedRice}
                        onChange={(e) => setProductionForm({ ...productionForm, reSortedRice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ash (Qtl)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productionForm.ash}
                        onChange={(e) => setProductionForm({ ...productionForm, ash: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={productionForm.notes}
                      onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional notes about this production batch..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Production Record
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProductionForm(false)}
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

        {/* Add Sale Form */}
        {showAddSaleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add By-Product Sale</h3>
                <form onSubmit={handleSaleSubmit} className="space-y-6">
                  {/* Sale Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                      <input
                        type="date"
                        value={saleForm.saleDate}
                        onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={saleForm.invoiceNumber}
                        onChange={(e) => setSaleForm({ ...saleForm, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="INV-001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                      <input
                        type="text"
                        value={saleForm.partyName}
                        onChange={(e) => setSaleForm({ ...saleForm, partyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Customer name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Party Phone</label>
                      <input
                        type="tel"
                        value={saleForm.partyPhone}
                        onChange={(e) => setSaleForm({ ...saleForm, partyPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Party Address</label>
                      <input
                        type="text"
                        value={saleForm.partyAddress}
                        onChange={(e) => setSaleForm({ ...saleForm, partyAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Customer address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                      <input
                        type="number"
                        value={saleForm.paymentTerms}
                        onChange={(e) => setSaleForm({ ...saleForm, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Add Items Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Add Items</h4>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                        <select
                          value={newItem.productType}
                          onChange={(e) => {
                            const productType = e.target.value as ByProductSaleItem['productType'];
                            setNewItem({ 
                              ...newItem, 
                              productType,
                              productName: productType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="husk">Husk</option>
                          <option value="bran-boiled">Bran (Boiled)</option>
                          <option value="bran-raw">Bran (Raw)</option>
                          <option value="broken-rice">Broken Rice</option>
                          <option value="param">Param</option>
                          <option value="rejection-rice">Rejection Rice</option>
                          <option value="re-sorted-rice">Re-sorted Rice</option>
                          <option value="ash">Ash</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                          type="text"
                          value={newItem.productName}
                          onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Product name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Qtl)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Available: {formatDecimal(getAvailableStock(newItem.productType), 2)} Qtl
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹/Qtl)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItem.rate}
                          onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                        <select
                          value={newItem.gstRate}
                          onChange={(e) => setNewItem({ ...newItem, gstRate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItemToSale}
                          disabled={!newItem.productName || !newItem.quantity || !newItem.rate}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>

                    {/* Items List */}
                    {saleForm.items.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty (Qtl)</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">GST</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {saleForm.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{formatDecimal(item.quantity, 2)}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.rate)}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.gstRate}%</td>
                                <td className="px-4 py-2 text-sm text-gray-900 font-medium">{formatCurrency(item.totalAmount)}</td>
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => removeItemFromSale(item.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={saleForm.notes}
                      onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={saleForm.items.length === 0}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Create Sale
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSaleForm(false)}
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

        {/* Add Payment Form */}
        {showAddPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Sale</label>
                    <select
                      value={paymentForm.saleId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, saleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Sale Invoice</option>
                      {byProductSales.filter(sale => sale.balanceAmount > 0).map(sale => (
                        <option key={sale.id} value={sale.id}>
                          {sale.invoiceNumber} - {sale.partyName} (Balance: {formatCurrency(sale.balanceAmount)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as ByProductPayment['paymentMethod'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="upi">UPI</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                    <input
                      type="text"
                      value={paymentForm.referenceNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Cheque/Transaction number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Payment notes..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentForm(false)}
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
      </div>
    </div>
  );
};

export default StreamlinedByProducts;