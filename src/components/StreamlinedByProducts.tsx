import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Package, TrendingUp, Users, DollarSign, Calendar, Edit, Save, X, Trash2, AlertCircle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { 
  ByProductProduction, 
  ByProductSale, 
  ByProductPayment, 
  ByProductStock,
  RiceProduction,
  FCIConsignment
} from '../types';
import { formatNumber, formatDecimal, formatCurrency, formatWeight } from '../utils/calculations';
import { 
  saveByProductProductions, loadByProductProductions,
  saveByProductSales, loadByProductSales,
  saveByProductPayments, loadByProductPayments,
  loadRiceProductions,
  loadFCIConsignments
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StreamlinedByProducts: React.FC = () => {
  const [byProductProductions, setByProductProductions] = useState<ByProductProduction[]>([]);
  const [byProductSales, setByProductSales] = useState<ByProductSale[]>([]);
  const [byProductPayments, setByProductPayments] = useState<ByProductPayment[]>([]);
  const [riceProductions, setRiceProductions] = useState<RiceProduction[]>([]);
  const [fciConsignments, setFciConsignments] = useState<FCIConsignment[]>([]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'production' | 'sales' | 'payments'>('dashboard');
  const [showAddProductionForm, setShowAddProductionForm] = useState(false);
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [editingProduction, setEditingProduction] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'production' | 'sale' | 'payment'; id: string } | null>(null);
  const [showStockDetails, setShowStockDetails] = useState(false);

  // Form states
  const [productionForm, setProductionForm] = useState({
    productionDate: '',
    productType: 'bran-boiled' as ByProductProduction['productType'],
    quantity: '',
    notes: ''
  });

  const [saleForm, setSaleForm] = useState({
    saleDate: '',
    invoiceNumber: '',
    partyName: '',
    partyPhone: '',
    partyAddress: '',
    items: [{ 
      productType: 'bran-boiled' as ByProductProduction['productType'], 
      quantity: '', 
      rate: '', 
      gstRate: 5 
    }],
    paymentTerms: 30,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    saleId: '',
    amount: '',
    paymentDate: '',
    paymentMethod: 'cash' as ByProductPayment['paymentMethod'],
    referenceNumber: '',
    notes: ''
  });

  const [editProductionForm, setEditProductionForm] = useState({
    productionDate: '',
    productType: 'bran-boiled' as ByProductProduction['productType'],
    quantity: '',
    notes: ''
  });

  const [editSaleForm, setEditSaleForm] = useState({
    saleDate: '',
    invoiceNumber: '',
    partyName: '',
    partyPhone: '',
    partyAddress: '',
    items: [{ 
      productType: 'bran-boiled' as ByProductProduction['productType'], 
      quantity: '', 
      rate: '', 
      gstRate: 5 
    }],
    paymentTerms: 30,
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    setByProductProductions(loadByProductProductions());
    setByProductSales(loadByProductSales());
    setByProductPayments(loadByProductPayments());
    setRiceProductions(loadRiceProductions());
    setFciConsignments(loadFCIConsignments());
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

  // Product type configurations
  const productTypes = {
    'husk': { name: 'Rice Husk', unit: 'Qtl', defaultGST: 5 },
    'bran-boiled': { name: 'Bran (Boiled)', unit: 'Qtl', defaultGST: 5 },
    'bran-raw': { name: 'Bran (Raw)', unit: 'Qtl', defaultGST: 5 },
    'broken-rice': { name: 'Broken Rice', unit: 'Qtl', defaultGST: 5 },
    'param': { name: 'Param (Small Broken)', unit: 'Qtl', defaultGST: 5 },
    'rejection-rice': { name: 'Rejection Rice', unit: 'Qtl', defaultGST: 5 },
    're-sorted-rice': { name: 'Re-sorted Rice', unit: 'Qtl', defaultGST: 5 },
    'ash': { name: 'Ash', unit: 'Qtl', defaultGST: 5 }
  };

  // Calculate correlated ACKs for a given date (within ±7 days)
  const getCorrelatedACKs = (productionDate: string) => {
    const targetDate = new Date(productionDate);
    const sevenDaysBefore = new Date(targetDate);
    sevenDaysBefore.setDate(targetDate.getDate() - 7);
    const sevenDaysAfter = new Date(targetDate);
    sevenDaysAfter.setDate(targetDate.getDate() + 7);

    const correlatedProductions = riceProductions.filter(prod => {
      const prodDate = new Date(prod.productionDate);
      return prodDate >= sevenDaysBefore && prodDate <= sevenDaysAfter;
    });

    const boiledACKs = correlatedProductions
      .filter(prod => prod.riceType === 'boiled')
      .reduce((sum, prod) => {
        const ackCount = prod.ackNumber.includes('ACK') ? parseInt(prod.ackNumber.split(' ')[0]) : 1;
        return sum + ackCount;
      }, 0);

    const rawACKs = correlatedProductions
      .filter(prod => prod.riceType === 'raw')
      .reduce((sum, prod) => {
        const ackCount = prod.ackNumber.includes('ACK') ? parseInt(prod.ackNumber.split(' ')[0]) : 1;
        return sum + ackCount;
      }, 0);

    return { boiledACKs, rawACKs, totalACKs: boiledACKs + rawACKs };
  };

  // Calculate stock levels
  const stockLevels = useMemo(() => {
    const stock: Record<string, ByProductStock> = {};

    // Initialize stock for all product types
    Object.keys(productTypes).forEach(type => {
      stock[type] = {
        productType: type as ByProductProduction['productType'],
        productName: productTypes[type as keyof typeof productTypes].name,
        totalProduced: 0,
        totalSold: 0,
        currentStock: 0,
        averageRate: 0,
        totalRevenue: 0,
        lastSaleDate: undefined
      };
    });

    // Add production quantities
    byProductProductions.forEach(production => {
      if (stock[production.productType]) {
        stock[production.productType].totalProduced += production.quantity;
        stock[production.productType].currentStock += production.quantity;
      }
    });

    // Subtract sales and calculate revenue
    byProductSales.forEach(sale => {
      sale.items.forEach(item => {
        if (stock[item.productType]) {
          stock[item.productType].totalSold += item.quantity;
          stock[item.productType].currentStock -= item.quantity;
          stock[item.productType].totalRevenue += item.totalAmount;
          
          // Update last sale date
          if (!stock[item.productType].lastSaleDate || sale.saleDate > stock[item.productType].lastSaleDate!) {
            stock[item.productType].lastSaleDate = sale.saleDate;
          }
        }
      });
    });

    // Calculate average rates
    Object.keys(stock).forEach(type => {
      if (stock[type].totalSold > 0) {
        stock[type].averageRate = stock[type].totalRevenue / stock[type].totalSold;
      }
    });

    return stock;
  }, [byProductProductions, byProductSales]);

  // Calculate summary stats
  const totalRevenue = useMemo(() => 
    byProductSales.reduce((sum, sale) => sum + sale.totalAmount, 0), 
    [byProductSales]
  );

  const totalPaidAmount = useMemo(() => 
    byProductPayments.reduce((sum, payment) => sum + payment.amount, 0), 
    [byProductPayments]
  );

  const pendingReceivables = totalRevenue - totalPaidAmount;

  const totalStockValue = useMemo(() => 
    Object.values(stockLevels).reduce((sum, stock) => 
      sum + (stock.currentStock * stock.averageRate), 0
    ), [stockLevels]
  );

  const overdueSales = useMemo(() => 
    byProductSales.filter(sale => {
      const dueDate = new Date(sale.dueDate);
      const today = new Date();
      return sale.balanceAmount > 0 && dueDate < today;
    }).length, 
    [byProductSales]
  );

  // Handle production form submission
  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const correlatedACKs = getCorrelatedACKs(productionForm.productionDate);
    const quantity = parseFloat(productionForm.quantity);
    const yieldPerACK = correlatedACKs.totalACKs > 0 ? quantity / correlatedACKs.totalACKs : 0;

    const newProduction: ByProductProduction = {
      id: Date.now().toString(),
      productionDate: productionForm.productionDate,
      productType: productionForm.productType,
      productName: productTypes[productionForm.productType].name,
      quantity,
      correlatedACKs: correlatedACKs.totalACKs,
      yieldPerACK,
      notes: productionForm.notes
    };

    setByProductProductions([...byProductProductions, newProduction]);
    setProductionForm({ productionDate: '', productType: 'bran-boiled', quantity: '', notes: '' });
    setShowAddProductionForm(false);
  };

  // Handle sale form submission
  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate stock availability
    for (const item of saleForm.items) {
      const availableStock = stockLevels[item.productType]?.currentStock || 0;
      const requestedQuantity = parseFloat(item.quantity);
      
      if (requestedQuantity > availableStock) {
        alert(`Insufficient stock for ${productTypes[item.productType].name}. Available: ${formatDecimal(availableStock)} Qtl`);
        return;
      }
    }

    const items = saleForm.items.map(item => {
      const quantity = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const amount = quantity * rate;
      const gstAmount = (amount * item.gstRate) / 100;
      const totalAmount = amount + gstAmount;

      return {
        id: Date.now().toString() + Math.random(),
        productType: item.productType,
        productName: productTypes[item.productType].name,
        quantity,
        rate,
        gstRate: item.gstRate,
        amount,
        gstAmount,
        totalAmount
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalAmount = subtotal + gstAmount;

    const dueDate = new Date(saleForm.saleDate);
    dueDate.setDate(dueDate.getDate() + saleForm.paymentTerms);

    const newSale: ByProductSale = {
      id: Date.now().toString(),
      saleDate: saleForm.saleDate,
      invoiceNumber: saleForm.invoiceNumber,
      partyName: saleForm.partyName,
      partyPhone: saleForm.partyPhone,
      partyAddress: saleForm.partyAddress,
      items,
      subtotal,
      gstAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      paymentStatus: 'pending',
      paymentTerms: saleForm.paymentTerms,
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
      items: [{ productType: 'bran-boiled', quantity: '', rate: '', gstRate: 5 }],
      paymentTerms: 30,
      notes: ''
    });
    setShowAddSaleForm(false);
  };

  // Handle payment form submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sale = byProductSales.find(s => s.id === paymentForm.saleId);
    if (!sale) return;

    const paymentAmount = parseFloat(paymentForm.amount);
    if (paymentAmount > sale.balanceAmount) {
      alert('Payment amount cannot exceed balance amount');
      return;
    }

    const newPayment: ByProductPayment = {
      id: Date.now().toString(),
      saleId: paymentForm.saleId,
      partyName: sale.partyName,
      amount: paymentAmount,
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      referenceNumber: paymentForm.referenceNumber,
      notes: paymentForm.notes
    };

    // Update sale payment status
    const updatedSales = byProductSales.map(s => {
      if (s.id === paymentForm.saleId) {
        const newPaidAmount = s.paidAmount + paymentAmount;
        const newBalanceAmount = s.totalAmount - newPaidAmount;
        return {
          ...s,
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          paymentStatus: newBalanceAmount <= 0 ? 'paid' as const : 'partial' as const
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

  // Add item to sale form
  const addSaleItem = () => {
    setSaleForm({
      ...saleForm,
      items: [...saleForm.items, { productType: 'bran-boiled', quantity: '', rate: '', gstRate: 5 }]
    });
  };

  // Remove item from sale form
  const removeSaleItem = (index: number) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter((_, i) => i !== index)
    });
  };

  // Update sale item
  const updateSaleItem = (index: number, field: string, value: any) => {
    const updatedItems = saleForm.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setSaleForm({ ...saleForm, items: updatedItems });
  };

  // Start editing production
  const startEditProduction = (production: ByProductProduction) => {
    setEditingProduction(production.id);
    setEditProductionForm({
      productionDate: production.productionDate,
      productType: production.productType,
      quantity: production.quantity.toString(),
      notes: production.notes || ''
    });
  };

  // Save production edit
  const saveProductionEdit = (id: string) => {
    const correlatedACKs = getCorrelatedACKs(editProductionForm.productionDate);
    const quantity = parseFloat(editProductionForm.quantity);
    const yieldPerACK = correlatedACKs.totalACKs > 0 ? quantity / correlatedACKs.totalACKs : 0;

    setByProductProductions(byProductProductions.map(production => 
      production.id === id ? {
        ...production,
        productionDate: editProductionForm.productionDate,
        productType: editProductionForm.productType,
        productName: productTypes[editProductionForm.productType].name,
        quantity,
        correlatedACKs: correlatedACKs.totalACKs,
        yieldPerACK,
        notes: editProductionForm.notes
      } : production
    ));
    setEditingProduction(null);
  };

  // Delete functions
  const deleteProduction = (id: string) => {
    setByProductProductions(byProductProductions.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
  };

  const deleteSale = (id: string) => {
    // Also delete associated payments
    setByProductPayments(byProductPayments.filter(p => p.saleId !== id));
    setByProductSales(byProductSales.filter(s => s.id !== id));
    setShowDeleteConfirm(null);
  };

  const deletePayment = (id: string) => {
    const payment = byProductPayments.find(p => p.id === id);
    if (payment) {
      // Update sale balance
      const updatedSales = byProductSales.map(s => {
        if (s.id === payment.saleId) {
          const newPaidAmount = s.paidAmount - payment.amount;
          const newBalanceAmount = s.totalAmount - newPaidAmount;
          return {
            ...s,
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            paymentStatus: newBalanceAmount <= 0 ? 'paid' as const : 
                          newPaidAmount > 0 ? 'partial' as const : 'pending' as const
          };
        }
        return s;
      });
      setByProductSales(updatedSales);
    }
    setByProductPayments(byProductPayments.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
  };

  // Export functions
  const exportStockAnalysis = () => {
    const csvContent = [
      ['Product Type', 'Product Name', 'Total Produced (Qtl)', 'Total Sold (Qtl)', 'Current Stock (Qtl)', 'Average Rate (₹/Qtl)', 'Total Revenue (₹)', 'Last Sale Date'],
      ...Object.values(stockLevels).map(stock => [
        stock.productType,
        stock.productName,
        formatDecimal(stock.totalProduced),
        formatDecimal(stock.totalSold),
        formatDecimal(stock.currentStock),
        formatDecimal(stock.averageRate),
        formatDecimal(stock.totalRevenue),
        stock.lastSaleDate || 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'by-products-stock-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">By-Products Management</h1>
            <p className="text-gray-600 mt-2">Track production yields, sales, and stock levels for rice mill by-products</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportStockAnalysis}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Package className="h-4 w-4 mr-2" />
              Export Stock Analysis
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="From by-product sales"
            icon={<DollarSign className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Pending Receivables"
            value={formatCurrency(pendingReceivables)}
            subtitle={`${overdueSales} overdue invoices`}
            icon={<Clock className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Stock Value"
            value={formatCurrency(totalStockValue)}
            subtitle="Current inventory value"
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Product Types"
            value={Object.keys(productTypes).length.toString()}
            subtitle={`${Object.values(stockLevels).filter(s => s.currentStock > 0).length} in stock`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Stock Dashboard', icon: Package },
                { id: 'production', label: 'Production Entry', icon: Plus },
                { id: 'sales', label: 'Sales Management', icon: Users },
                { id: 'payments', label: 'Payment Tracking', icon: DollarSign }
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Stock Dashboard</h3>
                  <button
                    onClick={() => setShowStockDetails(!showStockDetails)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    {showStockDetails ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>

                {/* Stock Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {Object.values(stockLevels).map((stock) => {
                    const stockPercentage = stock.totalProduced > 0 ? (stock.currentStock / stock.totalProduced) * 100 : 0;
                    const stockColor = stockPercentage > 50 ? 'bg-green-500' : stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500';
                    
                    return (
                      <div key={stock.productType} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 text-sm">{stock.productName}</h4>
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="font-semibold">{formatDecimal(stock.currentStock)} Qtl</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${stockColor}`}
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Produced: {formatDecimal(stock.totalProduced)}</span>
                            <span>Sold: {formatDecimal(stock.totalSold)}</span>
                          </div>
                          
                          {stock.averageRate > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              Avg Rate: {formatCurrency(stock.averageRate)}/Qtl
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Stock Table */}
                {showStockDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Detailed Stock Analysis</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">Produced</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">Sold</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">Stock</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">Avg Rate</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-700">Revenue</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Last Sale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.values(stockLevels).map((stock) => (
                            <tr key={stock.productType} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">{stock.productName}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{formatDecimal(stock.totalProduced)} Qtl</td>
                              <td className="px-3 py-2 text-right text-gray-600">{formatDecimal(stock.totalSold)} Qtl</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatDecimal(stock.currentStock)} Qtl</td>
                              <td className="px-3 py-2 text-right text-gray-600">{stock.averageRate > 0 ? formatCurrency(stock.averageRate) : '-'}</td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium">{formatCurrency(stock.totalRevenue)}</td>
                              <td className="px-3 py-2 text-gray-600">{stock.lastSaleDate ? new Date(stock.lastSaleDate).toLocaleDateString() : 'Never'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'production' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">By-Product Production Entry</h3>
                  <button
                    onClick={() => setShowAddProductionForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Production Entry
                  </button>
                </div>

                {/* Production Records Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlated ACKs</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield/ACK</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {byProductProductions.map((production) => (
                        <tr key={production.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {editingProduction === production.id ? (
                              <input
                                type="date"
                                value={editProductionForm.productionDate}
                                onChange={(e) => setEditProductionForm({ ...editProductionForm, productionDate: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              new Date(production.productionDate).toLocaleDateString()
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingProduction === production.id ? (
                              <select
                                value={editProductionForm.productType}
                                onChange={(e) => setEditProductionForm({ ...editProductionForm, productType: e.target.value as any })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                {Object.entries(productTypes).map(([key, type]) => (
                                  <option key={key} value={key}>{type.name}</option>
                                ))}
                              </select>
                            ) : (
                              production.productName
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {editingProduction === production.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editProductionForm.quantity}
                                onChange={(e) => setEditProductionForm({ ...editProductionForm, quantity: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              `${formatDecimal(production.quantity)} Qtl`
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {production.correlatedACKs} ACKs
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatDecimal(production.yieldPerACK, 2)} Qtl/ACK
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                            {editingProduction === production.id ? (
                              <textarea
                                value={editProductionForm.notes}
                                onChange={(e) => setEditProductionForm({ ...editProductionForm, notes: e.target.value })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            ) : (
                              <div className="truncate">{production.notes || '-'}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {editingProduction === production.id ? (
                                <>
                                  <button
                                    onClick={() => saveProductionEdit(production.id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Save changes"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingProduction(null)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel editing"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditProduction(production)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit production"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ type: 'production', id: production.id })}
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete production"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Sales Management</h3>
                  <button
                    onClick={() => setShowAddSaleForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sale
                  </button>
                </div>

                {/* Sales Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {byProductSales.map((sale) => {
                        const isOverdue = sale.balanceAmount > 0 && new Date(sale.dueDate) < new Date();
                        const daysOverdue = isOverdue ? calculateDaysOverdue(sale.dueDate) : 0;
                        
                        return (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {sale.invoiceNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(sale.saleDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{sale.partyName}</div>
                                {sale.partyPhone && (
                                  <div className="text-xs text-gray-500">{sale.partyPhone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                {sale.items.map((item, index) => (
                                  <div key={index} className="text-xs">
                                    {item.productName}: {formatDecimal(item.quantity)} Qtl @ {formatCurrency(item.rate)}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{formatCurrency(sale.totalAmount)}</div>
                                <div className="text-xs text-gray-500">
                                  Paid: {formatCurrency(sale.paidAmount)}
                                </div>
                                <div className="text-xs text-red-600">
                                  Balance: {formatCurrency(sale.balanceAmount)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.paymentStatus)}`}>
                                {getStatusIcon(sale.paymentStatus)}
                                <span className="ml-1 capitalize">{sale.paymentStatus}</span>
                              </span>
                              {isOverdue && (
                                <div className="text-xs text-red-600 mt-1">
                                  {daysOverdue} days overdue
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(sale.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: 'sale', id: sale.id })}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete sale"
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
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Tracking</h3>
                  <button
                    onClick={() => setShowAddPaymentForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </button>
                </div>

                {/* Payments Table */}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {payment.paymentMethod.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.referenceNumber || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                            <div className="truncate">{payment.notes || '-'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'payment', id: payment.id })}
                              className="text-red-600 hover:text-red-800"
                              title="Delete payment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Production Form */}
        {showAddProductionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add By-Product Production</h3>
                <form onSubmit={handleProductionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Production Date
                    </label>
                    <input
                      type="date"
                      value={productionForm.productionDate}
                      onChange={(e) => setProductionForm({ ...productionForm, productionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Type
                    </label>
                    <select
                      value={productionForm.productType}
                      onChange={(e) => setProductionForm({ ...productionForm, productType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(productTypes).map(([key, type]) => (
                        <option key={key} value={key}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (Quintals)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productionForm.quantity}
                      onChange={(e) => setProductionForm({ ...productionForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {productionForm.productionDate && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">ACK Correlation</h4>
                      <div className="text-xs text-blue-600">
                        {(() => {
                          const correlation = getCorrelatedACKs(productionForm.productionDate);
                          return (
                            <div>
                              <div>Boiled ACKs (±7 days): {correlation.boiledACKs}</div>
                              <div>Raw ACKs (±7 days): {correlation.rawACKs}</div>
                              <div>Total ACKs: {correlation.totalACKs}</div>
                              {productionForm.quantity && correlation.totalACKs > 0 && (
                                <div className="mt-1 font-medium">
                                  Yield: {formatDecimal(parseFloat(productionForm.quantity) / correlation.totalACKs, 2)} Qtl/ACK
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={productionForm.notes}
                      onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional production notes..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Production
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
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add By-Product Sale</h3>
                <form onSubmit={handleSaleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Date
                      </label>
                      <input
                        type="date"
                        value={saleForm.saleDate}
                        onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={saleForm.invoiceNumber}
                        onChange={(e) => setSaleForm({ ...saleForm, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Party Name
                    </label>
                    <input
                      type="text"
                      value={saleForm.partyName}
                      onChange={(e) => setSaleForm({ ...saleForm, partyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Party Phone
                      </label>
                      <input
                        type="tel"
                        value={saleForm.partyPhone}
                        onChange={(e) => setSaleForm({ ...saleForm, partyPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        value={saleForm.paymentTerms}
                        onChange={(e) => setSaleForm({ ...saleForm, paymentTerms: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Party Address
                    </label>
                    <textarea
                      value={saleForm.partyAddress}
                      onChange={(e) => setSaleForm({ ...saleForm, partyAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  {/* Sale Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Sale Items
                      </label>
                      <button
                        type="button"
                        onClick={addSaleItem}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Item
                      </button>
                    </div>
                    
                    {saleForm.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product
                            </label>
                            <select
                              value={item.productType}
                              onChange={(e) => updateSaleItem(index, 'productType', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              {Object.entries(productTypes).map(([key, type]) => (
                                <option key={key} value={key}>{type.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Available Stock
                            </label>
                            <div className="text-sm text-gray-600 py-1">
                              {formatDecimal(stockLevels[item.productType]?.currentStock || 0)} Qtl
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity (Qtl)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateSaleItem(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Rate (₹/Qtl)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateSaleItem(index, 'rate', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              GST %
                            </label>
                            <select
                              value={item.gstRate}
                              onChange={(e) => updateSaleItem(index, 'gstRate', parseInt(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                            </select>
                          </div>
                        </div>
                        
                        {item.quantity && item.rate && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex justify-between">
                              <span>Amount:</span>
                              <span>{formatCurrency(parseFloat(item.quantity) * parseFloat(item.rate))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST ({item.gstRate}%):</span>
                              <span>{formatCurrency((parseFloat(item.quantity) * parseFloat(item.rate) * item.gstRate) / 100)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Total:</span>
                              <span>{formatCurrency(parseFloat(item.quantity) * parseFloat(item.rate) * (1 + item.gstRate / 100))}</span>
                            </div>
                          </div>
                        )}
                        
                        {saleForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSaleItem(index)}
                            className="mt-2 text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove Item
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={saleForm.notes}
                      onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Optional sale notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Sale Invoice
                    </label>
                    <select
                      value={paymentForm.saleId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, saleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Invoice</option>
                      {byProductSales.filter(sale => sale.balanceAmount > 0).map(sale => (
                        <option key={sale.id} value={sale.id}>
                          {sale.invoiceNumber} - {sale.partyName} (Balance: {formatCurrency(sale.balanceAmount)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        value={paymentForm.referenceNumber}
                        onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Cheque/Transaction ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional payment notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200"
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (showDeleteConfirm.type === 'production') {
                        deleteProduction(showDeleteConfirm.id);
                      } else if (showDeleteConfirm.type === 'sale') {
                        deleteSale(showDeleteConfirm.id);
                      } else if (showDeleteConfirm.type === 'payment') {
                        deletePayment(showDeleteConfirm.id);
                      }
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

export default StreamlinedByProducts;