import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Package, TrendingUp, Users, IndianRupee, Calendar, Download, Edit, Save, X, Trash2 } from 'lucide-react';
import { ByProduct, SalesRecord, Customer } from '../types';
import { formatDecimal, formatCurrency, formatWeight } from '../utils/calculations';
import { 
  saveByProducts, loadByProducts, loadSalesRecords, loadCustomers
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StreamlinedByProducts: React.FC = () => {
  const [byProducts, setByProducts] = useState<ByProduct[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'product' | 'customer'>('all');
  const [selectedFilter, setSelectedFilter] = useState('');

  const [byProductForm, setByProductForm] = useState({
    name: '',
    type: 'bran-boiled' as ByProduct['type'],
    quantity: '',
    productionDate: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    type: 'bran-boiled' as ByProduct['type'],
    quantity: '',
    productionDate: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    setByProducts(loadByProducts());
    setSalesRecords(loadSalesRecords());
    setCustomers(loadCustomers());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (byProducts.length > 0) {
      saveByProducts(byProducts);
    }
  }, [byProducts]);

  // Filter by-product sales from sales records
  const byProductSales = useMemo(() => {
    return salesRecords.filter(sale => 
      sale.items.some(item => 
        ['bran', 'broken-rice', 'param', 'rejection-rice', 'other'].includes(item.productName.toLowerCase()) ||
        item.productName.toLowerCase().includes('bran') ||
        item.productName.toLowerCase().includes('broken') ||
        item.productName.toLowerCase().includes('param')
      )
    );
  }, [salesRecords]);

  // Calculate by-product sales summary
  const byProductSalesSummary = useMemo(() => {
    const summary: Record<string, { quantity: number; revenue: number; customers: Set<string> }> = {};
    
    byProductSales.forEach(sale => {
      sale.items.forEach(item => {
        const productKey = item.productName.toLowerCase();
        if (!summary[productKey]) {
          summary[productKey] = { quantity: 0, revenue: 0, customers: new Set() };
        }
        summary[productKey].quantity += item.quantity;
        summary[productKey].revenue += item.totalAmount;
        summary[productKey].customers.add(sale.partyName);
      });
    });

    return Object.entries(summary).map(([product, data]) => ({
      product,
      quantity: data.quantity,
      revenue: data.revenue,
      customerCount: data.customers.size,
      customers: Array.from(data.customers)
    }));
  }, [byProductSales]);

  // Calculate summary stats
  const totalByProductQuantity = useMemo(() => 
    byProducts.reduce((sum, product) => sum + product.quantity, 0), 
    [byProducts]
  );
  
  const totalByProductRevenue = useMemo(() => 
    byProductSales.reduce((sum, sale) => sum + sale.totalAmount, 0), 
    [byProductSales]
  );

  const totalByProductCustomers = useMemo(() => {
    const uniqueCustomers = new Set(byProductSales.map(sale => sale.partyName));
    return uniqueCustomers.size;
  }, [byProductSales]);

  // Filtered data based on selection
  const filteredData = useMemo(() => {
    if (filterBy === 'all') return byProductSalesSummary;
    if (filterBy === 'product' && selectedFilter) {
      return byProductSalesSummary.filter(item => 
        item.product.toLowerCase().includes(selectedFilter.toLowerCase())
      );
    }
    if (filterBy === 'customer' && selectedFilter) {
      return byProductSalesSummary.filter(item => 
        item.customers.some(customer => 
          customer.toLowerCase().includes(selectedFilter.toLowerCase())
        )
      );
    }
    return byProductSalesSummary;
  }, [byProductSalesSummary, filterBy, selectedFilter]);

  const handleSubmit = (e: React.FormEvent) => {
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

  const startEdit = (product: ByProduct) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      type: product.type,
      quantity: product.quantity.toString(),
      productionDate: product.productionDate,
      notes: product.notes || ''
    });
  };

  const saveEdit = (id: string) => {
    setByProducts(byProducts.map(product => 
      product.id === id ? {
        ...product,
        name: editForm.name,
        type: editForm.type,
        quantity: parseFloat(editForm.quantity),
        productionDate: editForm.productionDate,
        notes: editForm.notes
      } : product
    ));
    setEditingProduct(null);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({ name: '', type: 'bran-boiled', quantity: '', productionDate: '', notes: '' });
  };

  const deleteProduct = (id: string) => {
    setByProducts(byProducts.filter(product => product.id !== id));
    setShowDeleteConfirm(null);
  };

  const exportByProductData = () => {
    const csvContent = [
      ['Product Type', 'Quantity Sold', 'Revenue', 'Customer Count', 'Customers'],
      ...filteredData.map(item => [
        item.product,
        item.quantity,
        item.revenue,
        item.customerCount,
        item.customers.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'by-product-sales-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueProducts = Array.from(new Set(byProductSalesSummary.map(item => item.product)));
  const uniqueCustomers = Array.from(new Set(byProductSales.map(sale => sale.partyName)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">By-Products Management</h1>
            <p className="text-gray-600 mt-2">Track by-product inventory and sales performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportByProductData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add By-Product
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Production"
            value={formatWeight(totalByProductQuantity)}
            subtitle="By-products produced"
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="Sales Revenue"
            value={formatCurrency(totalByProductRevenue)}
            subtitle="From by-product sales"
            icon={<IndianRupee className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Active Customers"
            value={totalByProductCustomers.toString()}
            subtitle="Buying by-products"
            icon={<Users className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Product Types"
            value={byProducts.length.toString()}
            subtitle={`${uniqueProducts.length} sold types`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Analysis Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
                <select
                  value={filterBy}
                  onChange={(e) => {
                    setFilterBy(e.target.value as any);
                    setSelectedFilter('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Records</option>
                  <option value="product">By Product Type</option>
                  <option value="customer">By Customer</option>
                </select>
              </div>
              
              {filterBy === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Products</option>
                    {uniqueProducts.map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
              )}

              {filterBy === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Customers</option>
                    {uniqueCustomers.map(customer => (
                      <option key={customer} value={customer}>{customer}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* By-Product Inventory */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">By-Product Inventory</h3>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {byProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingProduct === product.id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            product.name
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {editingProduct === product.id ? (
                            <select
                              value={editForm.type}
                              onChange={(e) => setEditForm({ ...editForm, type: e.target.value as ByProduct['type'] })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="bran-boiled">Bran (Boiled)</option>
                              <option value="bran-raw">Bran (Raw)</option>
                              <option value="broken-rice">Broken Rice</option>
                              <option value="param">Param</option>
                              <option value="rejection-rice">Rejection Rice</option>
                              <option value="other">Other</option>
                            </select>
                          ) : (
                            <span className="capitalize">{product.type.replace('-', ' ')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.quantity}
                              onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            formatDecimal(product.quantity, 2)
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {editingProduct === product.id ? (
                            <input
                              type="date"
                              value={editForm.productionDate}
                              onChange={(e) => setEditForm({ ...editForm, productionDate: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            new Date(product.productionDate).toLocaleDateString()
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                          {editingProduct === product.id ? (
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              rows={2}
                            />
                          ) : (
                            <div className="truncate">{product.notes || '-'}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {editingProduct === product.id ? (
                              <>
                                <button
                                  onClick={() => saveEdit(product.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Save changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-red-600 hover:text-red-800"
                                  title="Cancel editing"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(product)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit product"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(product.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete product"
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
            )}
          </div>
        </div>

        {/* Sales Analysis */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">By-Product Sales Analysis</h3>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sales data available for the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Names</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {item.product}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDecimal(item.quantity, 2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.revenue / item.quantity)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {item.customerCount}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={item.customers.join(', ')}>
                            {item.customers.join(', ')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add By-Product</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add By-Product
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
                  Are you sure you want to delete this by-product? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => deleteProduct(showDeleteConfirm)}
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