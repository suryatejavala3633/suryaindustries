import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Package, AlertCircle, Edit, Save, X, Trash2, Eye, History, FileText, Truck } from 'lucide-react';
import { GunnyStock, FRKStock, RexinSticker, GunnyUsage, FRKUsage, FCIConsignment } from '../types';
import { formatNumber, formatDecimal, formatCurrency } from '../utils/calculations';
import { 
  saveGunnyStocks, loadGunnyStocks, saveFRKStocks, loadFRKStocks,
  saveRexinStickers, loadRexinStickers, saveGunnyUsage, loadGunnyUsage,
  saveFRKUsage, loadFRKUsage, loadFCIConsignments
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StockManagement: React.FC = () => {
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [frkStocks, setFrkStocks] = useState<FRKStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [gunnyUsage, setGunnyUsage] = useState<GunnyUsage[]>([]);
  const [frkUsage, setFrkUsage] = useState<FRKUsage[]>([]);
  const [fciConsignments, setFciConsignments] = useState<FCIConsignment[]>([]);
  
  const [activeTab, setActiveTab] = useState<'gunny' | 'frk' | 'stickers' | 'usage-logs'>('gunny');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUsageDetails, setShowUsageDetails] = useState<string | null>(null);

  const [gunnyForm, setGunnyForm] = useState({
    type: '2024-25-new' as '2024-25-new' | '2023-24-leftover',
    quantity: '',
    source: 'new-bales' as 'new-bales' | 'received-with-paddy',
    dateReceived: '',
    notes: ''
  });

  const [frkForm, setFrkForm] = useState({
    batchNumber: '',
    quantity: '',
    supplier: '',
    bags: '',
    certificateNumber: '',
    premixCertificateNumber: '',
    dateReceived: '',
    expiryDate: '',
    notes: ''
  });

  const [stickerForm, setStickerForm] = useState({
    quantity: '',
    dateReceived: ''
  });

  // Load data on component mount
  useEffect(() => {
    setGunnyStocks(loadGunnyStocks());
    setFrkStocks(loadFRKStocks());
    setRexinStickers(loadRexinStickers());
    setGunnyUsage(loadGunnyUsage());
    setFrkUsage(loadFRKUsage());
    setFciConsignments(loadFCIConsignments());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (gunnyStocks.length > 0) saveGunnyStocks(gunnyStocks);
  }, [gunnyStocks]);

  useEffect(() => {
    if (frkStocks.length > 0) saveFRKStocks(frkStocks);
  }, [frkStocks]);

  useEffect(() => {
    if (rexinStickers.length > 0) saveRexinStickers(rexinStickers);
  }, [rexinStickers]);

  useEffect(() => {
    if (gunnyUsage.length > 0) saveGunnyUsage(gunnyUsage);
  }, [gunnyUsage]);

  useEffect(() => {
    if (frkUsage.length > 0) saveFRKUsage(frkUsage);
  }, [frkUsage]);

  // Calculate summary stats
  const totalGunnyStock = useMemo(() => 
    gunnyStocks.reduce((sum, stock) => sum + stock.currentQuantity, 0), 
    [gunnyStocks]
  );
  
  const totalFRKStock = useMemo(() => 
    frkStocks.reduce((sum, stock) => sum + stock.currentQuantity, 0), 
    [frkStocks]
  );
  
  const totalStickerStock = useMemo(() => 
    rexinStickers.reduce((sum, stock) => sum + stock.remainingQuantity, 0), 
    [rexinStickers]
  );

  const totalGunnyUsed = useMemo(() => 
    gunnyStocks.reduce((sum, stock) => sum + stock.usedQuantity, 0), 
    [gunnyStocks]
  );

  const totalFRKUsed = useMemo(() => 
    frkStocks.reduce((sum, stock) => sum + stock.usedQuantity, 0), 
    [frkStocks]
  );

  const handleGunnySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(gunnyForm.quantity);
    
    const newStock: GunnyStock = {
      id: Date.now().toString(),
      type: gunnyForm.type,
      originalQuantity: quantity,
      currentQuantity: quantity,
      usedQuantity: 0,
      source: gunnyForm.source,
      dateReceived: gunnyForm.dateReceived,
      notes: gunnyForm.notes
    };
    
    setGunnyStocks([...gunnyStocks, newStock]);
    setGunnyForm({ type: '2024-25-new', quantity: '', source: 'new-bales', dateReceived: '', notes: '' });
    setShowAddForm(false);
  };

  const handleFRKSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(frkForm.quantity);
    
    const newStock: FRKStock = {
      id: Date.now().toString(),
      batchNumber: frkForm.batchNumber,
      originalQuantity: quantity,
      currentQuantity: quantity,
      usedQuantity: 0,
      supplier: frkForm.supplier,
      bags: parseInt(frkForm.bags),
      certificateNumber: frkForm.certificateNumber,
      premixCertificateNumber: frkForm.premixCertificateNumber,
      dateReceived: frkForm.dateReceived,
      expiryDate: frkForm.expiryDate || undefined,
      notes: frkForm.notes
    };
    
    setFrkStocks([...frkStocks, newStock]);
    setFrkForm({ 
      batchNumber: '', quantity: '', supplier: '', bags: '', 
      certificateNumber: '', premixCertificateNumber: '', 
      dateReceived: '', expiryDate: '', notes: '' 
    });
    setShowAddForm(false);
  };

  const handleStickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(stickerForm.quantity);
    
    const newSticker: RexinSticker = {
      id: Date.now().toString(),
      quantity,
      dateReceived: stickerForm.dateReceived,
      usedQuantity: 0,
      remainingQuantity: quantity
    };
    
    setRexinStickers([...rexinStickers, newSticker]);
    setStickerForm({ quantity: '', dateReceived: '' });
    setShowAddForm(false);
  };

  const getUsageForStock = (stockId: string, type: 'gunny' | 'frk') => {
    if (type === 'gunny') {
      return gunnyUsage.filter(usage => usage.stockId === stockId);
    } else {
      return frkUsage.filter(usage => usage.stockId === stockId);
    }
  };

  const getStockUtilization = (originalQuantity: number, currentQuantity: number) => {
    const usedPercentage = ((originalQuantity - currentQuantity) / originalQuantity) * 100;
    return Math.round(usedPercentage);
  };

  const getStockStatusColor = (originalQuantity: number, currentQuantity: number) => {
    const utilization = getStockUtilization(originalQuantity, currentQuantity);
    if (utilization < 25) return 'bg-green-100 text-green-800';
    if (utilization < 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const deleteStock = (id: string, type: 'gunny' | 'frk' | 'sticker') => {
    if (type === 'gunny') {
      setGunnyStocks(gunnyStocks.filter(stock => stock.id !== id));
      // Also remove related usage records
      const updatedUsage = gunnyUsage.filter(usage => usage.stockId !== id);
      setGunnyUsage(updatedUsage);
      saveGunnyUsage(updatedUsage);
    } else if (type === 'frk') {
      setFrkStocks(frkStocks.filter(stock => stock.id !== id));
      // Also remove related usage records
      const updatedUsage = frkUsage.filter(usage => usage.stockId !== id);
      setFrkUsage(updatedUsage);
      saveFRKUsage(updatedUsage);
    } else {
      setRexinStickers(rexinStickers.filter(stock => stock.id !== id));
    }
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">Manage gunny bags, FRK, and rexin stickers with detailed usage tracking</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Gunny Bags"
            value={formatNumber(totalGunnyStock)}
            subtitle={`Used: ${formatNumber(totalGunnyUsed)}`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="FRK Stock"
            value={`${formatDecimal(totalFRKStock)} kg`}
            subtitle={`Used: ${formatDecimal(totalFRKUsed)} kg`}
            icon={<Package className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Rexin Stickers"
            value={formatNumber(totalStickerStock)}
            icon={<Package className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Active Batches"
            value={formatNumber(gunnyStocks.length + frkStocks.length)}
            subtitle="Stock entries"
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'gunny', label: 'Gunny Bags', icon: Package },
                { id: 'frk', label: 'FRK Stock', icon: Package },
                { id: 'stickers', label: 'Rexin Stickers', icon: Package },
                { id: 'usage-logs', label: 'Usage Logs', icon: History }
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
            {/* Gunny Bags Tab */}
            {activeTab === 'gunny' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gunny Bag Stock</h3>
                {gunnyStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No gunny stock records yet. Add your first stock entry.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {gunnyStocks.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stock.type === '2024-25-new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {stock.type === '2024-25-new' ? '2024-25 New' : '2023-24 Leftover'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(stock.originalQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatNumber(stock.currentQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatNumber(stock.usedQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${getStockUtilization(stock.originalQuantity, stock.currentQuantity)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${getStockStatusColor(stock.originalQuantity, stock.currentQuantity)}`}>
                                  {getStockUtilization(stock.originalQuantity, stock.currentQuantity)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {stock.source === 'new-bales' ? 'New Bales' : 'With Paddy'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(stock.dateReceived).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setShowUsageDetails(stock.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View usage details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(stock.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete stock"
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

            {/* FRK Stock Tab */}
            {activeTab === 'frk' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FRK Stock</h3>
                {frkStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FRK stock records yet. Add your first stock entry.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {frkStocks.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              {stock.batchNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stock.supplier}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatDecimal(stock.originalQuantity)} kg
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatDecimal(stock.currentQuantity)} kg
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatDecimal(stock.usedQuantity)} kg
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${getStockUtilization(stock.originalQuantity, stock.currentQuantity)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${getStockStatusColor(stock.originalQuantity, stock.currentQuantity)}`}>
                                  {getStockUtilization(stock.originalQuantity, stock.currentQuantity)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(stock.dateReceived).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setShowUsageDetails(stock.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View usage details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(stock.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete stock"
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

            {/* Rexin Stickers Tab */}
            {activeTab === 'stickers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rexin Stickers</h3>
                {rexinStickers.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No rexin sticker records yet. Add your first stock entry.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rexinStickers.map((sticker) => (
                          <tr key={sticker.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatNumber(sticker.quantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {formatNumber(sticker.usedQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatNumber(sticker.remainingQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(sticker.dateReceived).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => setShowDeleteConfirm(sticker.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete stock"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Usage Logs Tab */}
            {activeTab === 'usage-logs' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Usage Logs</h3>
                <div className="space-y-6">
                  {/* Gunny Usage */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Gunny Bag Usage</h4>
                    {gunnyUsage.length === 0 ? (
                      <p className="text-gray-500 text-sm">No gunny usage records yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ACK Number</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Stock Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Quantity Used</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Usage Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {gunnyUsage.map((usage) => (
                              <tr key={usage.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {usage.ackNumber}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {usage.stockType === '2024-25-new' ? '2024-25 New' : '2023-24 Leftover'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatNumber(usage.quantityUsed)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(usage.usageDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                  {usage.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* FRK Usage */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">FRK Usage</h4>
                    {frkUsage.length === 0 ? (
                      <p className="text-gray-500 text-sm">No FRK usage records yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">ACK Number</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Batch Number</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Supplier</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Quantity Used</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Usage Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {frkUsage.map((usage) => (
                              <tr key={usage.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {usage.ackNumber}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  {usage.batchNumber}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {usage.supplier}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDecimal(usage.quantityUsed)} kg
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(usage.usageDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">
                                  {usage.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Stock Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock</h3>
                
                {/* Stock Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setActiveTab('gunny')}
                      className={`px-3 py-2 text-sm rounded-lg ${activeTab === 'gunny' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Gunny Bags
                    </button>
                    <button
                      onClick={() => setActiveTab('frk')}
                      className={`px-3 py-2 text-sm rounded-lg ${activeTab === 'frk' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      FRK
                    </button>
                    <button
                      onClick={() => setActiveTab('stickers')}
                      className={`px-3 py-2 text-sm rounded-lg ${activeTab === 'stickers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Stickers
                    </button>
                  </div>
                </div>

                {/* Gunny Form */}
                {activeTab === 'gunny' && (
                  <form onSubmit={handleGunnySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={gunnyForm.type}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2024-25-new">2024-25 New</option>
                        <option value="2023-24-leftover">2023-24 Leftover</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={gunnyForm.quantity}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <select
                        value={gunnyForm.source}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, source: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="new-bales">New Bales</option>
                        <option value="received-with-paddy">Received with Paddy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={gunnyForm.dateReceived}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={gunnyForm.notes}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Gunny Stock
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

                {/* FRK Form */}
                {activeTab === 'frk' && (
                  <form onSubmit={handleFRKSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={frkForm.batchNumber}
                        onChange={(e) => setFrkForm({ ...frkForm, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={frkForm.quantity}
                        onChange={(e) => setFrkForm({ ...frkForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        value={frkForm.supplier}
                        onChange={(e) => setFrkForm({ ...frkForm, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Bags</label>
                      <input
                        type="number"
                        value={frkForm.bags}
                        onChange={(e) => setFrkForm({ ...frkForm, bags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                      <input
                        type="text"
                        value={frkForm.certificateNumber}
                        onChange={(e) => setFrkForm({ ...frkForm, certificateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Premix Certificate Number</label>
                      <input
                        type="text"
                        value={frkForm.premixCertificateNumber}
                        onChange={(e) => setFrkForm({ ...frkForm, premixCertificateNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={frkForm.dateReceived}
                        onChange={(e) => setFrkForm({ ...frkForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={frkForm.expiryDate}
                        onChange={(e) => setFrkForm({ ...frkForm, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={frkForm.notes}
                        onChange={(e) => setFrkForm({ ...frkForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add FRK Stock
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

                {/* Sticker Form */}
                {activeTab === 'stickers' && (
                  <form onSubmit={handleStickerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={stickerForm.quantity}
                        onChange={(e) => setStickerForm({ ...stickerForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                      <input
                        type="date"
                        value={stickerForm.dateReceived}
                        onChange={(e) => setStickerForm({ ...stickerForm, dateReceived: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Add Sticker Stock
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

        {/* Usage Details Modal */}
        {showUsageDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Usage Details</h3>
                
                {(() => {
                  const stock = gunnyStocks.find(s => s.id === showUsageDetails) || frkStocks.find(s => s.id === showUsageDetails);
                  const isGunny = gunnyStocks.find(s => s.id === showUsageDetails) !== undefined;
                  const usage = getUsageForStock(showUsageDetails, isGunny ? 'gunny' : 'frk');
                  
                  return (
                    <div className="space-y-6">
                      {/* Stock Summary */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Stock Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Original Quantity:</span>
                            <div className="font-semibold">
                              {isGunny 
                                ? formatNumber((stock as GunnyStock)?.originalQuantity || 0)
                                : `${formatDecimal((stock as FRKStock)?.originalQuantity || 0)} kg`
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Quantity:</span>
                            <div className="font-semibold text-green-600">
                              {isGunny 
                                ? formatNumber((stock as GunnyStock)?.currentQuantity || 0)
                                : `${formatDecimal((stock as FRKStock)?.currentQuantity || 0)} kg`
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Used Quantity:</span>
                            <div className="font-semibold text-red-600">
                              {isGunny 
                                ? formatNumber((stock as GunnyStock)?.usedQuantity || 0)
                                : `${formatDecimal((stock as FRKStock)?.usedQuantity || 0)} kg`
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Utilization:</span>
                            <div className="font-semibold">
                              {stock ? getStockUtilization(
                                isGunny ? (stock as GunnyStock).originalQuantity : (stock as FRKStock).originalQuantity,
                                isGunny ? (stock as GunnyStock).currentQuantity : (stock as FRKStock).currentQuantity
                              ) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Usage Records */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Usage Records</h4>
                        {usage.length === 0 ? (
                          <p className="text-gray-500">No usage records found for this stock.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Number</th>
                                  {!isGunny && (
                                    <>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    </>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Used</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {usage.map((record: any) => (
                                  <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                      {record.ackNumber}
                                    </td>
                                    {!isGunny && (
                                      <>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {record.batchNumber}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                          {record.supplier}
                                        </td>
                                      </>
                                    )}
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {isGunny 
                                        ? formatNumber(record.quantityUsed)
                                        : `${formatDecimal(record.quantityUsed)} kg`
                                      }
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                      {new Date(record.usageDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                      {record.notes || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowUsageDetails(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
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
                  Are you sure you want to delete this stock record? This will also remove all associated usage logs and cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const stockType = gunnyStocks.find(s => s.id === showDeleteConfirm) ? 'gunny' :
                                       frkStocks.find(s => s.id === showDeleteConfirm) ? 'frk' : 'sticker';
                      deleteStock(showDeleteConfirm, stockType);
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

export default StockManagement;