import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Package, Users, Receipt, CreditCard, TrendingUp, IndianRupee, Calendar, Clock, Settings } from 'lucide-react';
import { ByProduct, Customer, Product, SaleInvoice, Payment, Expense } from '../types';
import { formatDecimal, formatCurrency, calculateDaysDue, getGSTRate } from '../utils/calculations';
import { 
  saveByProducts, loadByProducts, saveCustomers, loadCustomers, 
  saveProducts, loadProducts, saveSales, loadSales, 
  savePayments, loadPayments, saveExpenses, loadExpenses 
} from '../utils/dataStorage';
import StatsCard from './StatsCard';
import DataBackupManager from './DataBackupManager';

const ByProductsRevenue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'byproducts' | 'customers' | 'products' | 'sales' | 'payments' | 'expenses' | 'backup'>('byproducts');
  const [byProducts, setByProducts] = useState<ByProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load data on component mount
  useEffect(() => {
    setByProducts(loadByProducts());
    setCustomers(loadCustomers());
    setProducts(loadProducts());
    setSales(loadSales());
    setPayments(loadPayments());
    setExpenses(loadExpenses());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    saveByProducts(byProducts);
  }, [byProducts]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  // Form states
  const [byProductForm, setByProductForm] = useState({
    name: '',
    type: 'bran-boiled' as ByProduct['type'],
    quantity: '',
    productionDate: '',
    notes: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: '',
    creditLimit: '',
    paymentTerms: '30',
    notes: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'rice' as Product['category'],
    unit: 'qtl' as Product['unit'],
    baseRate: '',
    gstSlab: '5%' as Product['gstSlab'],
    description: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'electricity' as Expense['category'],
    description: '',
    amount: '',
    expenseDate: '',
    vendorName: '',
    billNumber: '',
    gstAmount: '',
    paymentMethod: 'cash' as Expense['paymentMethod'],
    notes: ''
  });

  // Calculate summary stats
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + sale.totalAmount, 0), [sales]);
  const totalReceived = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments]);
  const totalOutstanding = useMemo(() => sales.reduce((sum, sale) => sum + sale.balanceAmount, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

  // Handle form submissions
  const handleByProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newByProduct: ByProduct = {
      id: Date.now().toString(),
      name: byProductForm.name,
      type: byProductForm.type,
      quantity: parseFloat(byProductForm.quantity),
      productionDate: byProductForm.productionDate,
      notes: byProductForm.notes
    };
    setByProducts([...byProducts, newByProduct]);
    setByProductForm({ name: '', type: 'bran-boiled', quantity: '', productionDate: '', notes: '' });
    setShowAddForm(false);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: customerForm.name,
      address: customerForm.address,
      phone: customerForm.phone,
      email: customerForm.email,
      gstNumber: customerForm.gstNumber,
      panNumber: customerForm.panNumber,
      creditLimit: parseFloat(customerForm.creditLimit) || 0,
      paymentTerms: parseInt(customerForm.paymentTerms),
      createdDate: new Date().toISOString().split('T')[0],
      notes: customerForm.notes
    };
    setCustomers([...customers, newCustomer]);
    setCustomerForm({ name: '', address: '', phone: '', email: '', gstNumber: '', panNumber: '', creditLimit: '', paymentTerms: '30', notes: '' });
    setShowAddForm(false);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now().toString(),
      name: productForm.name,
      category: productForm.category,
      unit: productForm.unit,
      baseRate: parseFloat(productForm.baseRate),
      gstSlab: productForm.gstSlab,
      description: productForm.description
    };
    setProducts([...products, newProduct]);
    setProductForm({ name: '', category: 'rice', unit: 'qtl', baseRate: '', gstSlab: '5%', description: '' });
    setShowAddForm(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      expenseDate: expenseForm.expenseDate,
      vendorName: expenseForm.vendorName,
      billNumber: expenseForm.billNumber,
      gstAmount: parseFloat(expenseForm.gstAmount) || 0,
      paymentMethod: expenseForm.paymentMethod,
      notes: expenseForm.notes
    };
    setExpenses([...expenses, newExpense]);
    setExpenseForm({ category: 'electricity', description: '', amount: '', expenseDate: '', vendorName: '', billNumber: '', gstAmount: '', paymentMethod: 'cash', notes: '' });
    setShowAddForm(false);
  };

  const handleDataImported = () => {
    // Reload all data after import
    setByProducts(loadByProducts());
    setCustomers(loadCustomers());
    setProducts(loadProducts());
    setSales(loadSales());
    setPayments(loadPayments());
    setExpenses(loadExpenses());
  };

  const tabs = [
    { id: 'byproducts', label: 'By-Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products/Services', icon: Receipt },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: IndianRupee },
    { id: 'backup', label: 'Data Backup', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">By-Products & Revenue</h1>
            <p className="text-gray-600 mt-2">Manage by-products, customers, sales and mill operations</p>
          </div>
          {activeTab !== 'backup' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'byproducts' ? 'By-Product' : activeTab === 'customers' ? 'Customer' : activeTab === 'products' ? 'Product' : activeTab === 'expenses' ? 'Expense' : activeTab === 'sales' ? 'Sale' : 'Payment'}
            </button>
          )}
        </div>

        {/* Summary Stats */}
        {activeTab !== 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard
              title="Total Sales"
              value={formatCurrency(totalSales)}
              icon={<TrendingUp className="h-6 w-6" />}
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Received"
              value={formatCurrency(totalReceived)}
              icon={<CreditCard className="h-6 w-6" />}
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Outstanding"
              value={formatCurrency(totalOutstanding)}
              icon={<Clock className="h-6 w-6" />}
              color="from-orange-500 to-orange-600"
            />
            <StatsCard
              title="Expenses"
              value={formatCurrency(totalExpenses)}
              icon={<IndianRupee className="h-6 w-6" />}
              color="from-red-500 to-red-600"
            />
            <StatsCard
              title="By-Products"
              value={formatDecimal(byProducts.reduce((sum, product) => sum + product.quantity, 0))}
              subtitle="Total Quintals"
              icon={<Package className="h-6 w-6" />}
              color="from-purple-500 to-purple-600"
            />
          </div>
        )}

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
            {activeTab === 'backup' && (
              <DataBackupManager onDataImported={handleDataImported} />
            )}

            {activeTab === 'byproducts' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">By-Products Inventory</h3>
                {byProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No by-products recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (Qtl)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {byProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {product.type.replace('-', ' ')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDecimal(product.quantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(product.productionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {product.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'customers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Database</h3>
                {customers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No customers added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {customers.map((customer) => {
                          const customerOutstanding = sales
                            .filter(sale => sale.customerId === customer.id)
                            .reduce((sum, sale) => sum + sale.balanceAmount, 0);
                          
                          return (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {customer.phone}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {customer.gstNumber || '-'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(customer.creditLimit)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {customer.paymentTerms} days
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                {formatCurrency(customerOutstanding)}
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
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'byproducts' ? 'By-Product' : activeTab === 'customers' ? 'Customer' : activeTab === 'products' ? 'Product' : activeTab === 'expenses' ? 'Expense' : activeTab === 'sales' ? 'Sale' : 'Payment'}
                </h3>
                
                {activeTab === 'byproducts' && (
                  <form onSubmit={handleByProductSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={byProductForm.name}
                        onChange={(e) => setByProductForm({ ...byProductForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={byProductForm.type}
                        onChange={(e) => setByProductForm({ ...byProductForm, type: e.target.value as ByProduct['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bran-boiled">Bran (Boiled)</option>
                        <option value="bran-raw">Bran (Raw)</option>
                        <option value="broken-rice">Broken Rice</option>
                        <option value="param">Param</option>
                        <option value="rejection-rice">Rejection Rice</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Quintals)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={byProductForm.quantity}
                        onChange={(e) => setByProductForm({ ...byProductForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
                      <input
                        type="date"
                        value={byProductForm.productionDate}
                        onChange={(e) => setByProductForm({ ...byProductForm, productionDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={byProductForm.notes}
                        onChange={(e) => setByProductForm({ ...byProductForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add By-Product
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'customers' && (
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        value={customerForm.gstNumber}
                        onChange={(e) => setCustomerForm({ ...customerForm, gstNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={customerForm.creditLimit}
                        onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
                      <input
                        type="number"
                        value={customerForm.paymentTerms}
                        onChange={(e) => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Customer
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
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

export default ByProductsRevenue;