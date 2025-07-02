import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Package, Sticker, Truck, Edit, Save, X, Download, AlertTriangle } from 'lucide-react';
import { GunnyStock, FRKStock, RexinSticker, FCIConsignment } from '../types';
import { formatNumber, formatDecimal } from '../utils/calculations';
import { 
  saveGunnyStocks, loadGunnyStocks, saveFRKStocks, loadFRKStocks, 
  saveRexinStickers, loadRexinStickers, loadFCIConsignments 
} from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StockManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gunny' | 'frk' | 'stickers'>('gunny');
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [frkStocks, setFRKStocks] = useState<FRKStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [fciConsignments, setFciConsignments] = useState<FCIConsignment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [gunnyForm, setGunnyForm] = useState({
    type: '2024-25-new' as GunnyStock['type'],
    quantity: '',
    source: 'new-bales' as GunnyStock['source'],
    dateReceived: '',
    notes: ''
  });

  const [frkForm, setFrkForm] = useState({
    quantity: '',
    supplier: '',
    bags: '',
    batchNumber: '',
    certificateNumber: '',
    premixCertificateNumber: '',
    dateReceived: '',
    expiryDate: '',
    notes: ''
  });

  const [stickerForm, setStickerForm] = useState({
    quantity: '',
    dateReceived: '',
    notes: ''
  });

  const [editForms, setEditForms] = useState({
    gunny: { type: '2024-25-new' as GunnyStock['type'], quantity: '', source: 'new-bales' as GunnyStock['source'], dateReceived: '', notes: '' },
    frk: { quantity: '', supplier: '', bags: '', batchNumber: '', certificateNumber: '', premixCertificateNumber: '', dateReceived: '', expiryDate: '', notes: '' },
    sticker: { quantity: '', dateReceived: '', notes: '' }
  });

  // Load data on component mount
  useEffect(() => {
    console.log('Loading stock data...');
    const loadedGunnyStocks = loadGunnyStocks();
    const loadedFRKStocks = loadFRKStocks();
    const loadedRexinStickers = loadRexinStickers();
    const loadedFCIConsignments = loadFCIConsignments();
    
    console.log('Loaded data:', {
      gunnyStocks: loadedGunnyStocks.length,
      frkStocks: loadedFRKStocks.length,
      rexinStickers: loadedRexinStickers.length,
      fciConsignments: loadedFCIConsignments.length
    });
    
    setGunnyStocks(loadedGunnyStocks);
    setFRKStocks(loadedFRKStocks);
    setRexinStickers(loadedRexinStickers);
    setFciConsignments(loadedFCIConsignments);
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (gunnyStocks.length > 0) {
      console.log('Saving gunny stocks:', gunnyStocks.length);
      saveGunnyStocks(gunnyStocks);
    }
  }, [gunnyStocks]);

  useEffect(() => {
    if (frkStocks.length > 0) {
      console.log('Saving FRK stocks:', frkStocks.length);
      saveFRKStocks(frkStocks);
    }
  }, [frkStocks]);

  useEffect(() => {
    if (rexinStickers.length > 0) {
      console.log('Saving rexin stickers:', rexinStickers.length);
      saveRexinStickers(rexinStickers);
    }
  }, [rexinStickers]);

  // Calculate stock summaries
  const totalGunnies = useMemo(() => gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0), [gunnyStocks]);
  const totalFRK = useMemo(() => frkStocks.reduce((sum, stock) => sum + stock.quantity, 0), [frkStocks]);
  const totalStickers = useMemo(() => rexinStickers.reduce((sum, stock) => sum + stock.remainingQuantity, 0), [rexinStickers]);

  // Calculate used quantities from FCI consignments
  const usedGunnies = useMemo(() => fciConsignments.reduce((sum, consignment) => sum + (consignment.totalBags || 580), 0), [fciConsignments]);
  const usedFRK = useMemo(() => fciConsignments.reduce((sum, consignment) => sum + (consignment.frkQuantity || 290), 0), [fciConsignments]);
  const usedStickers = useMemo(() => fciConsignments.reduce((sum, consignment) => sum + (consignment.stickersUsed || 580), 0), [fciConsignments]);

  // Calculate ACK capacities
  const gunnyACKCapacity = Math.floor(totalGunnies / 580);
  const frkACKCapacity = Math.floor(totalFRK / 290);
  const stickerACKCapacity = Math.floor(totalStickers / 580);
  const minACKCapacity = Math.min(gunnyACKCapacity, frkACKCapacity, stickerACKCapacity);

  // Handle form submissions
  const handleGunnySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting gunny form:', gunnyForm);
    
    const newStock: GunnyStock = {
      id: Date.now().toString(),
      type: gunnyForm.type,
      quantity: parseInt(gunnyForm.quantity),
      source: gunnyForm.source,
      dateReceived: gunnyForm.dateReceived,
      notes: gunnyForm.notes
    };
    
    console.log('Creating new gunny stock:', newStock);
    const updatedStocks = [...gunnyStocks, newStock];
    setGunnyStocks(updatedStocks);
    saveGunnyStocks(updatedStocks);
    
    setGunnyForm({ type: '2024-25-new', quantity: '', source: 'new-bales', dateReceived: '', notes: '' });
    setShowAddForm(false);
  };

  const handleFRKSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting FRK form:', frkForm);
    
    const newStock: FRKStock = {
      id: Date.now().toString(),
      quantity: parseInt(frkForm.quantity),
      supplier: frkForm.supplier,
      bags: parseInt(frkForm.bags),
      batchNumber: frkForm.batchNumber,
      certificateNumber: frkForm.certificateNumber,
      premixCertificateNumber: frkForm.premixCertificateNumber,
      dateReceived: frkForm.dateReceived,
      expiryDate: frkForm.expiryDate,
      notes: frkForm.notes
    };
    
    console.log('Creating new FRK stock:', newStock);
    const updatedStocks = [...frkStocks, newStock];
    setFRKStocks(updatedStocks);
    saveFRKStocks(updatedStocks);
    
    setFrkForm({ quantity: '', supplier: '', bags: '', batchNumber: '', certificateNumber: '', premixCertificateNumber: '', dateReceived: '', expiryDate: '', notes: '' });
    setShowAddForm(false);
  };

  const handleStickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting sticker form:', stickerForm);
    
    const newSticker: RexinSticker = {
      id: Date.now().toString(),
      quantity: parseInt(stickerForm.quantity),
      dateReceived: stickerForm.dateReceived,
      usedQuantity: 0,
      remainingQuantity: parseInt(stickerForm.quantity)
    };
    
    console.log('Creating new rexin sticker:', newSticker);
    const updatedStickers = [...rexinStickers, newSticker];
    setRexinStickers(updatedStickers);
    saveRexinStickers(updatedStickers);
    
    setStickerForm({ quantity: '', dateReceived: '', notes: '' });
    setShowAddForm(false);
  };

  // Handle editing
  const startEdit = (id: string, type: 'gunny' | 'frk' | 'sticker') => {
    setEditingId(id);
    
    if (type === 'gunny') {
      const item = gunnyStocks.find(s => s.id === id);
      if (item) {
        setEditForms({
          ...editForms,
          gunny: {
            type: item.type,
            quantity: item.quantity.toString(),
            source: item.source,
            dateReceived: item.dateReceived,
            notes: item.notes || ''
          }
        });
      }
    } else if (type === 'frk') {
      const item = frkStocks.find(s => s.id === id);
      if (item) {
        setEditForms({
          ...editForms,
          frk: {
            quantity: item.quantity.toString(),
            supplier: item.supplier,
            bags: item.bags.toString(),
            batchNumber: item.batchNumber,
            certificateNumber: item.certificateNumber,
            premixCertificateNumber: item.premixCertificateNumber,
            dateReceived: item.dateReceived,
            expiryDate: item.expiryDate || '',
            notes: item.notes || ''
          }
        });
      }
    } else if (type === 'sticker') {
      const item = rexinStickers.find(s => s.id === id);
      if (item) {
        setEditForms({
          ...editForms,
          sticker: {
            quantity: item.quantity.toString(),
            dateReceived: item.dateReceived,
            notes: ''
          }
        });
      }
    }
  };

  const saveEdit = (id: string, type: 'gunny' | 'frk' | 'sticker') => {
    if (type === 'gunny') {
      const updatedStocks = gunnyStocks.map(stock => 
        stock.id === id ? {
          ...stock,
          type: editForms.gunny.type,
          quantity: parseInt(editForms.gunny.quantity),
          source: editForms.gunny.source,
          dateReceived: editForms.gunny.dateReceived,
          notes: editForms.gunny.notes
        } : stock
      );
      setGunnyStocks(updatedStocks);
      saveGunnyStocks(updatedStocks);
    } else if (type === 'frk') {
      const updatedStocks = frkStocks.map(stock => 
        stock.id === id ? {
          ...stock,
          quantity: parseInt(editForms.frk.quantity),
          supplier: editForms.frk.supplier,
          bags: parseInt(editForms.frk.bags),
          batchNumber: editForms.frk.batchNumber,
          certificateNumber: editForms.frk.certificateNumber,
          premixCertificateNumber: editForms.frk.premixCertificateNumber,
          dateReceived: editForms.frk.dateReceived,
          expiryDate: editForms.frk.expiryDate,
          notes: editForms.frk.notes
        } : stock
      );
      setFRKStocks(updatedStocks);
      saveFRKStocks(updatedStocks);
    } else if (type === 'sticker') {
      const updatedStickers = rexinStickers.map(sticker => 
        sticker.id === id ? {
          ...sticker,
          quantity: parseInt(editForms.sticker.quantity),
          dateReceived: editForms.sticker.dateReceived,
          remainingQuantity: parseInt(editForms.sticker.quantity) - sticker.usedQuantity
        } : sticker
      );
      setRexinStickers(updatedStickers);
      saveRexinStickers(updatedStickers);
    }
    
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const exportStockData = () => {
    const csvContent = [
      ['Type', 'Item', 'Quantity', 'Date', 'Notes'],
      ...gunnyStocks.map(stock => ['Gunny', stock.type, stock.quantity, stock.dateReceived, stock.notes || '']),
      ...frkStocks.map(stock => ['FRK', stock.supplier, stock.quantity, stock.dateReceived, stock.notes || '']),
      ...rexinStickers.map(sticker => ['Stickers', 'Rexin Stickers', sticker.remainingQuantity, sticker.dateReceived, ''])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-management-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'gunny', label: 'Gunny Stock', icon: Package },
    { id: 'frk', label: 'FRK Stock', icon: Truck },
    { id: 'stickers', label: 'Rexin Stickers', icon: Sticker }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">Manage gunny bags, FRK stock, and rexin stickers inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportStockData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab === 'gunny' ? 'Gunny Stock' : activeTab === 'frk' ? 'FRK Stock' : 'Rexin Stickers'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Gunny Stock"
            value={formatNumber(totalGunnies)}
            subtitle={`${gunnyACKCapacity} ACKs capacity`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="FRK Stock"
            value={`${formatNumber(totalFRK)} kg`}
            subtitle={`${frkACKCapacity} ACKs capacity`}
            icon={<Truck className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Rexin Stickers"
            value={formatNumber(totalStickers)}
            subtitle={`${stickerACKCapacity} ACKs capacity`}
            icon={<Sticker className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Min ACK Capacity"
            value={formatNumber(minACKCapacity)}
            subtitle="Limiting factor"
            icon={<AlertTriangle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
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
            {activeTab === 'gunny' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gunny Bag Inventory</h3>
                {gunnyStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No gunny stock recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {gunnyStocks.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingId === stock.id ? (
                                <select
                                  value={editForms.gunny.type}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    gunny: { ...editForms.gunny, type: e.target.value as GunnyStock['type'] }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="2024-25-new">2024-25 New</option>
                                  <option value="2023-24-leftover">2023-24 Leftover</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  stock.type === '2024-25-new' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {stock.type === '2024-25-new' ? '2024-25 New' : '2023-24 Leftover'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingId === stock.id ? (
                                <input
                                  type="number"
                                  value={editForms.gunny.quantity}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    gunny: { ...editForms.gunny, quantity: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatNumber(stock.quantity)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                              {editingId === stock.id ? (
                                <select
                                  value={editForms.gunny.source}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    gunny: { ...editForms.gunny, source: e.target.value as GunnyStock['source'] }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="new-bales">New Bales</option>
                                  <option value="received-with-paddy">Received with Paddy</option>
                                </select>
                              ) : (
                                stock.source.replace('-', ' ')
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === stock.id ? (
                                <input
                                  type="date"
                                  value={editForms.gunny.dateReceived}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    gunny: { ...editForms.gunny, dateReceived: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(stock.dateReceived).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              {editingId === stock.id ? (
                                <textarea
                                  value={editForms.gunny.notes}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    gunny: { ...editForms.gunny, notes: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  rows={2}
                                />
                              ) : (
                                <div className="truncate" title={stock.notes}>
                                  {stock.notes || '-'}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingId === stock.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(stock.id, 'gunny')}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(stock.id, 'gunny')}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
            )}

            {activeTab === 'frk' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FRK (Fortified Rice Kernels) Stock</h3>
                {frkStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FRK stock recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (kg)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {frkStocks.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingId === stock.id ? (
                                <input
                                  type="text"
                                  value={editForms.frk.supplier}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, supplier: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.supplier
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingId === stock.id ? (
                                <input
                                  type="number"
                                  value={editForms.frk.quantity}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, quantity: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatNumber(stock.quantity)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === stock.id ? (
                                <input
                                  type="number"
                                  value={editForms.frk.bags}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, bags: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatNumber(stock.bags)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === stock.id ? (
                                <input
                                  type="text"
                                  value={editForms.frk.batchNumber}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, batchNumber: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.batchNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === stock.id ? (
                                <input
                                  type="text"
                                  value={editForms.frk.certificateNumber}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, certificateNumber: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.certificateNumber
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === stock.id ? (
                                <input
                                  type="date"
                                  value={editForms.frk.dateReceived}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    frk: { ...editForms.frk, dateReceived: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(stock.dateReceived).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingId === stock.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(stock.id, 'frk')}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(stock.id, 'frk')}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
            )}

            {activeTab === 'stickers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rexin Stickers Inventory</h3>
                {rexinStickers.length === 0 ? (
                  <div className="text-center py-8">
                    <Sticker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No rexin stickers recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACK Capacity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rexinStickers.map((sticker) => (
                          <tr key={sticker.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingId === sticker.id ? (
                                <input
                                  type="number"
                                  value={editForms.sticker.quantity}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    sticker: { ...editForms.sticker, quantity: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatNumber(sticker.quantity)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                              {formatNumber(sticker.usedQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {formatNumber(sticker.remainingQuantity)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === sticker.id ? (
                                <input
                                  type="date"
                                  value={editForms.sticker.dateReceived}
                                  onChange={(e) => setEditForms({
                                    ...editForms,
                                    sticker: { ...editForms.sticker, dateReceived: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(sticker.dateReceived).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                              {Math.floor(sticker.remainingQuantity / 580)} ACKs
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingId === sticker.id ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(sticker.id, 'sticker')}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(sticker.id, 'sticker')}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
            )}
          </div>
        </div>

        {/* Add Forms */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add {activeTab === 'gunny' ? 'Gunny Stock' : activeTab === 'frk' ? 'FRK Stock' : 'Rexin Stickers'}
                </h3>
                
                {activeTab === 'gunny' && (
                  <form onSubmit={handleGunnySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={gunnyForm.type}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, type: e.target.value as GunnyStock['type'] })}
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
                        onChange={(e) => setGunnyForm({ ...gunnyForm, source: e.target.value as GunnyStock['source'] })}
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
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Gunny Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'frk' && (
                  <form onSubmit={handleFRKSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                      <input
                        type="number"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
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
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add FRK Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

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
                      <p className="text-xs text-gray-500 mt-1">
                        Each ACK requires 580 stickers
                      </p>
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
                    {stickerForm.quantity && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          ACK Capacity: <span className="font-semibold text-blue-600">
                            {Math.floor(parseInt(stickerForm.quantity) / 580)} ACKs
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Rexin Stickers
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

export default StockManagement;