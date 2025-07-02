import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Package, Sticker, Wheat, Edit, Save, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { GunnyStock, FRKStock, RexinSticker } from '../types';
import { formatDecimal, formatCurrency } from '../utils/calculations';
import { saveGunnyStocks, loadGunnyStocks, saveFRKStocks, loadFRKStocks, saveRexinStickers, loadRexinStickers } from '../utils/dataStorage';
import StatsCard from './StatsCard';

const StockManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gunny' | 'frk' | 'stickers'>('gunny');
  const [gunnyStocks, setGunnyStocks] = useState<GunnyStock[]>([]);
  const [frkStocks, setFRKStocks] = useState<FRKStock[]>([]);
  const [rexinStickers, setRexinStickers] = useState<RexinSticker[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    console.log('Loading stock data...');
    setGunnyStocks(loadGunnyStocks());
    setFRKStocks(loadFRKStocks());
    setRexinStickers(loadRexinStickers());
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (gunnyStocks.length >= 0) {
      console.log('Saving gunny stocks:', gunnyStocks);
      saveGunnyStocks(gunnyStocks);
    }
  }, [gunnyStocks]);

  useEffect(() => {
    if (frkStocks.length >= 0) {
      console.log('Saving FRK stocks:', frkStocks);
      saveFRKStocks(frkStocks);
    }
  }, [frkStocks]);

  useEffect(() => {
    if (rexinStickers.length >= 0) {
      console.log('Saving rexin stickers:', rexinStickers);
      saveRexinStickers(rexinStickers);
    }
  }, [rexinStickers]);

  // Form states
  const [gunnyForm, setGunnyForm] = useState({
    type: '2024-25-new' as GunnyStock['type'],
    quantity: '',
    source: 'new-bales' as GunnyStock['source'],
    dateReceived: '',
    notes: ''
  });

  const [frkForm, setFRKForm] = useState({
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
    dateReceived: ''
  });

  const [editGunnyForm, setEditGunnyForm] = useState({
    type: '2024-25-new' as GunnyStock['type'],
    quantity: '',
    source: 'new-bales' as GunnyStock['source'],
    dateReceived: '',
    notes: ''
  });

  const [editFRKForm, setEditFRKForm] = useState({
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

  const [editStickerForm, setEditStickerForm] = useState({
    quantity: '',
    dateReceived: '',
    usedQuantity: '',
    remainingQuantity: ''
  });

  // Calculate summary stats
  const totalGunnyStock = useMemo(() => gunnyStocks.reduce((sum, stock) => sum + stock.quantity, 0), [gunnyStocks]);
  const totalFRKStock = useMemo(() => frkStocks.reduce((sum, stock) => sum + stock.quantity, 0), [frkStocks]);
  const totalRexinStickers = useMemo(() => rexinStickers.reduce((sum, sticker) => sticker.remainingQuantity, 0), [rexinStickers]);
  const usedRexinStickers = useMemo(() => rexinStickers.reduce((sum, sticker) => sum + sticker.usedQuantity, 0), [rexinStickers]);

  // Calculate ACK capacity
  const gunnyACKCapacity = Math.floor(totalGunnyStock / 580);
  const stickerACKCapacity = Math.floor(totalRexinStickers / 580);
  const frkACKCapacity = Math.floor(totalFRKStock / 290); // 290 kg FRK per ACK
  const maxACKCapacity = Math.min(gunnyACKCapacity, stickerACKCapacity, frkACKCapacity);

  // Handle form submissions
  const handleGunnySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting gunny form:', gunnyForm);
    
    const newGunnyStock: GunnyStock = {
      id: Date.now().toString(),
      type: gunnyForm.type,
      quantity: parseInt(gunnyForm.quantity),
      source: gunnyForm.source,
      dateReceived: gunnyForm.dateReceived,
      notes: gunnyForm.notes
    };
    
    console.log('Creating new gunny stock:', newGunnyStock);
    const updatedStocks = [...gunnyStocks, newGunnyStock];
    setGunnyStocks(updatedStocks);
    
    // Force save immediately
    saveGunnyStocks(updatedStocks);
    
    setGunnyForm({ type: '2024-25-new', quantity: '', source: 'new-bales', dateReceived: '', notes: '' });
    setShowAddForm(false);
  };

  const handleFRKSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting FRK form:', frkForm);
    
    const newFRKStock: FRKStock = {
      id: Date.now().toString(),
      quantity: parseFloat(frkForm.quantity),
      supplier: frkForm.supplier,
      bags: parseInt(frkForm.bags),
      batchNumber: frkForm.batchNumber,
      certificateNumber: frkForm.certificateNumber,
      premixCertificateNumber: frkForm.premixCertificateNumber,
      dateReceived: frkForm.dateReceived,
      expiryDate: frkForm.expiryDate || undefined,
      notes: frkForm.notes
    };
    
    console.log('Creating new FRK stock:', newFRKStock);
    const updatedStocks = [...frkStocks, newFRKStock];
    setFRKStocks(updatedStocks);
    
    // Force save immediately
    saveFRKStocks(updatedStocks);
    
    setFRKForm({ quantity: '', supplier: '', bags: '', batchNumber: '', certificateNumber: '', premixCertificateNumber: '', dateReceived: '', expiryDate: '', notes: '' });
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
    
    // Force save immediately
    saveRexinStickers(updatedStickers);
    
    setStickerForm({ quantity: '', dateReceived: '' });
    setShowAddForm(false);
  };

  // Handle editing
  const startEditGunny = (stock: GunnyStock) => {
    setEditingItem(stock.id);
    setEditGunnyForm({
      type: stock.type,
      quantity: stock.quantity.toString(),
      source: stock.source,
      dateReceived: stock.dateReceived,
      notes: stock.notes || ''
    });
  };

  const startEditFRK = (stock: FRKStock) => {
    setEditingItem(stock.id);
    setEditFRKForm({
      quantity: stock.quantity.toString(),
      supplier: stock.supplier,
      bags: stock.bags.toString(),
      batchNumber: stock.batchNumber,
      certificateNumber: stock.certificateNumber,
      premixCertificateNumber: stock.premixCertificateNumber,
      dateReceived: stock.dateReceived,
      expiryDate: stock.expiryDate || '',
      notes: stock.notes || ''
    });
  };

  const startEditSticker = (sticker: RexinSticker) => {
    setEditingItem(sticker.id);
    setEditStickerForm({
      quantity: sticker.quantity.toString(),
      dateReceived: sticker.dateReceived,
      usedQuantity: sticker.usedQuantity.toString(),
      remainingQuantity: sticker.remainingQuantity.toString()
    });
  };

  const saveGunnyEdit = (id: string) => {
    const updatedStocks = gunnyStocks.map(stock => 
      stock.id === id ? {
        ...stock,
        type: editGunnyForm.type,
        quantity: parseInt(editGunnyForm.quantity),
        source: editGunnyForm.source,
        dateReceived: editGunnyForm.dateReceived,
        notes: editGunnyForm.notes
      } : stock
    );
    setGunnyStocks(updatedStocks);
    saveGunnyStocks(updatedStocks);
    setEditingItem(null);
  };

  const saveFRKEdit = (id: string) => {
    const updatedStocks = frkStocks.map(stock => 
      stock.id === id ? {
        ...stock,
        quantity: parseFloat(editFRKForm.quantity),
        supplier: editFRKForm.supplier,
        bags: parseInt(editFRKForm.bags),
        batchNumber: editFRKForm.batchNumber,
        certificateNumber: editFRKForm.certificateNumber,
        premixCertificateNumber: editFRKForm.premixCertificateNumber,
        dateReceived: editFRKForm.dateReceived,
        expiryDate: editFRKForm.expiryDate || undefined,
        notes: editFRKForm.notes
      } : stock
    );
    setFRKStocks(updatedStocks);
    saveFRKStocks(updatedStocks);
    setEditingItem(null);
  };

  const saveStickerEdit = (id: string) => {
    const updatedStickers = rexinStickers.map(sticker => 
      sticker.id === id ? {
        ...sticker,
        quantity: parseInt(editStickerForm.quantity),
        dateReceived: editStickerForm.dateReceived,
        usedQuantity: parseInt(editStickerForm.usedQuantity),
        remainingQuantity: parseInt(editStickerForm.remainingQuantity)
      } : sticker
    );
    setRexinStickers(updatedStickers);
    saveRexinStickers(updatedStickers);
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditGunnyForm({ type: '2024-25-new', quantity: '', source: 'new-bales', dateReceived: '', notes: '' });
    setEditFRKForm({ quantity: '', supplier: '', bags: '', batchNumber: '', certificateNumber: '', premixCertificateNumber: '', dateReceived: '', expiryDate: '', notes: '' });
    setEditStickerForm({ quantity: '', dateReceived: '', usedQuantity: '', remainingQuantity: '' });
  };

  const exportData = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'gunny') {
      csvContent = [
        ['Type', 'Quantity', 'Source', 'Date Received', 'Notes'],
        ...gunnyStocks.map(stock => [
          stock.type,
          stock.quantity,
          stock.source,
          stock.dateReceived,
          stock.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'gunny-stocks.csv';
    } else if (activeTab === 'frk') {
      csvContent = [
        ['Quantity (kg)', 'Supplier', 'Bags', 'Batch Number', 'Certificate Number', 'Premix Certificate', 'Date Received', 'Expiry Date', 'Notes'],
        ...frkStocks.map(stock => [
          stock.quantity,
          stock.supplier,
          stock.bags,
          stock.batchNumber,
          stock.certificateNumber,
          stock.premixCertificateNumber,
          stock.dateReceived,
          stock.expiryDate || '',
          stock.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'frk-stocks.csv';
    } else {
      csvContent = [
        ['Total Quantity', 'Used Quantity', 'Remaining Quantity', 'Date Received'],
        ...rexinStickers.map(sticker => [
          sticker.quantity,
          sticker.usedQuantity,
          sticker.remainingQuantity,
          sticker.dateReceived
        ])
      ].map(row => row.join(',')).join('\n');
      filename = 'rexin-stickers.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'gunny', label: 'Gunny Stocks', icon: Package },
    { id: 'frk', label: 'FRK Stocks', icon: Wheat },
    { id: 'stickers', label: 'Rexin Stickers', icon: Sticker }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">Manage gunny bags, FRK stocks, and rexin stickers inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
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
              Add {activeTab === 'gunny' ? 'Gunny Stock' : activeTab === 'frk' ? 'FRK Stock' : 'Stickers'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Gunny Bags"
            value={totalGunnyStock.toString()}
            subtitle={`${gunnyACKCapacity} ACKs capacity`}
            icon={<Package className="h-6 w-6" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="FRK Stock"
            value={`${formatDecimal(totalFRKStock)} kg`}
            subtitle={`${frkACKCapacity} ACKs capacity`}
            icon={<Wheat className="h-6 w-6" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="Rexin Stickers"
            value={totalRexinStickers.toString()}
            subtitle={`${stickerACKCapacity} ACKs capacity`}
            icon={<Sticker className="h-6 w-6" />}
            color="from-purple-500 to-purple-600"
          />
          <StatsCard
            title="Used Stickers"
            value={usedRexinStickers.toString()}
            subtitle="Total consumed"
            icon={<AlertCircle className="h-6 w-6" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="Max ACK Capacity"
            value={`${maxACKCapacity} ACKs`}
            subtitle="Based on limiting stock"
            icon={<CheckCircle className="h-6 w-6" />}
            color={maxACKCapacity > 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600"}
          />
        </div>

        {/* ACK Capacity Breakdown */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ACK Production Capacity Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">Gunny Bags</h4>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-blue-700">Available: {totalGunnyStock.toLocaleString()} bags</div>
                  <div className="text-sm text-blue-700">Per ACK: 580 bags</div>
                  <div className="text-lg font-bold text-blue-800">{gunnyACKCapacity} ACKs possible</div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-900">FRK Stock</h4>
                  <Wheat className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-green-700">Available: {formatDecimal(totalFRKStock)} kg</div>
                  <div className="text-sm text-green-700">Per ACK: 290 kg</div>
                  <div className="text-lg font-bold text-green-800">{frkACKCapacity} ACKs possible</div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900">Rexin Stickers</h4>
                  <Sticker className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-purple-700">Available: {totalRexinStickers.toLocaleString()} stickers</div>
                  <div className="text-sm text-purple-700">Per ACK: 580 stickers</div>
                  <div className="text-lg font-bold text-purple-800">{stickerACKCapacity} ACKs possible</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Maximum ACK Production Capacity</h4>
                  <p className="text-sm text-gray-600">Limited by the stock with lowest capacity</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${maxACKCapacity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {maxACKCapacity} ACKs
                  </div>
                  <div className="text-sm text-gray-500">
                    {maxACKCapacity === gunnyACKCapacity && maxACKCapacity === stickerACKCapacity && maxACKCapacity === frkACKCapacity 
                      ? 'All stocks balanced' 
                      : `Limited by ${maxACKCapacity === gunnyACKCapacity ? 'Gunny Bags' : maxACKCapacity === frkACKCapacity ? 'FRK Stock' : 'Rexin Stickers'}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    <p className="text-gray-600">No gunny stocks recorded yet.</p>
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
                              {editingItem === stock.id ? (
                                <select
                                  value={editGunnyForm.type}
                                  onChange={(e) => setEditGunnyForm({ ...editGunnyForm, type: e.target.value as GunnyStock['type'] })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="2024-25-new">2024-25 New</option>
                                  <option value="2023-24-leftover">2023-24 Leftover</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  stock.type === '2024-25-new' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {stock.type === '2024-25-new' ? 'New 2024-25' : 'Leftover 2023-24'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingItem === stock.id ? (
                                <input
                                  type="number"
                                  value={editGunnyForm.quantity}
                                  onChange={(e) => setEditGunnyForm({ ...editGunnyForm, quantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.quantity.toLocaleString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <select
                                  value={editGunnyForm.source}
                                  onChange={(e) => setEditGunnyForm({ ...editGunnyForm, source: e.target.value as GunnyStock['source'] })}
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
                              {editingItem === stock.id ? (
                                <input
                                  type="date"
                                  value={editGunnyForm.dateReceived}
                                  onChange={(e) => setEditGunnyForm({ ...editGunnyForm, dateReceived: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(stock.dateReceived).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                              {editingItem === stock.id ? (
                                <textarea
                                  value={editGunnyForm.notes}
                                  onChange={(e) => setEditGunnyForm({ ...editGunnyForm, notes: e.target.value })}
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
                                {editingItem === stock.id ? (
                                  <>
                                    <button
                                      onClick={() => saveGunnyEdit(stock.id)}
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
                                    onClick={() => startEditGunny(stock)}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FRK (Fortified Rice Kernels) Inventory</h3>
                {frkStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Wheat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FRK stocks recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (kg)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificates</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {frkStocks.map((stock) => (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingItem === stock.id ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editFRKForm.quantity}
                                  onChange={(e) => setEditFRKForm({ ...editFRKForm, quantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                formatDecimal(stock.quantity)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <input
                                  type="text"
                                  value={editFRKForm.supplier}
                                  onChange={(e) => setEditFRKForm({ ...editFRKForm, supplier: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.supplier
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <input
                                  type="number"
                                  value={editFRKForm.bags}
                                  onChange={(e) => setEditFRKForm({ ...editFRKForm, bags: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.bags
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <input
                                  type="text"
                                  value={editFRKForm.batchNumber}
                                  onChange={(e) => setEditFRKForm({ ...editFRKForm, batchNumber: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                stock.batchNumber
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Certificate No."
                                    value={editFRKForm.certificateNumber}
                                    onChange={(e) => setEditFRKForm({ ...editFRKForm, certificateNumber: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Premix Certificate"
                                    value={editFRKForm.premixCertificateNumber}
                                    onChange={(e) => setEditFRKForm({ ...editFRKForm, premixCertificateNumber: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-xs">Cert: {stock.certificateNumber}</div>
                                  <div className="text-xs">Premix: {stock.premixCertificateNumber}</div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {editingItem === stock.id ? (
                                <div className="space-y-1">
                                  <input
                                    type="date"
                                    value={editFRKForm.dateReceived}
                                    onChange={(e) => setEditFRKForm({ ...editFRKForm, dateReceived: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="date"
                                    value={editFRKForm.expiryDate}
                                    onChange={(e) => setEditFRKForm({ ...editFRKForm, expiryDate: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-xs">Received: {new Date(stock.dateReceived).toLocaleDateString()}</div>
                                  {stock.expiryDate && <div className="text-xs">Expires: {new Date(stock.expiryDate).toLocaleDateString()}</div>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === stock.id ? (
                                  <>
                                    <button
                                      onClick={() => saveFRKEdit(stock.id)}
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
                                    onClick={() => startEditFRK(stock)}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rexin Sticker Inventory</h3>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage %</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rexinStickers.map((sticker) => (
                          <tr key={sticker.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {editingItem === sticker.id ? (
                                <input
                                  type="number"
                                  value={editStickerForm.quantity}
                                  onChange={(e) => setEditStickerForm({ ...editStickerForm, quantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                sticker.quantity.toLocaleString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                              {editingItem === sticker.id ? (
                                <input
                                  type="number"
                                  value={editStickerForm.usedQuantity}
                                  onChange={(e) => setEditStickerForm({ ...editStickerForm, usedQuantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                sticker.usedQuantity.toLocaleString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {editingItem === sticker.id ? (
                                <input
                                  type="number"
                                  value={editStickerForm.remainingQuantity}
                                  onChange={(e) => setEditStickerForm({ ...editStickerForm, remainingQuantity: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                sticker.remainingQuantity.toLocaleString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingItem === sticker.id ? (
                                <input
                                  type="date"
                                  value={editStickerForm.dateReceived}
                                  onChange={(e) => setEditStickerForm({ ...editStickerForm, dateReceived: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                new Date(sticker.dateReceived).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(sticker.usedQuantity / sticker.quantity) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">
                                  {Math.round((sticker.usedQuantity / sticker.quantity) * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {editingItem === sticker.id ? (
                                  <>
                                    <button
                                      onClick={() => saveStickerEdit(sticker.id)}
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
                                    onClick={() => startEditSticker(sticker)}
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
                        <option value="2024-25-new">2024-25 New Gunnies</option>
                        <option value="2023-24-leftover">2023-24 Leftover Gunnies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={gunnyForm.quantity}
                        onChange={(e) => setGunnyForm({ ...gunnyForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of gunny bags"
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
                        placeholder="Optional notes..."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Stock
                      </button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'frk' && (
                  <form onSubmit={handleFRKSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={frkForm.quantity}
                          onChange={(e) => setFRKForm({ ...frkForm, quantity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Bags</label>
                        <input
                          type="number"
                          value={frkForm.bags}
                          onChange={(e) => setFRKForm({ ...frkForm, bags: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Each bag = 20kg"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        value={frkForm.supplier}
                        onChange={(e) => setFRKForm({ ...frkForm, supplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={frkForm.batchNumber}
                        onChange={(e) => setFRKForm({ ...frkForm, batchNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                        <input
                          type="text"
                          value={frkForm.certificateNumber}
                          onChange={(e) => setFRKForm({ ...frkForm, certificateNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Premix Certificate</label>
                        <input
                          type="text"
                          value={frkForm.premixCertificateNumber}
                          onChange={(e) => setFRKForm({ ...frkForm, premixCertificateNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                        <input
                          type="date"
                          value={frkForm.dateReceived}
                          onChange={(e) => setFRKForm({ ...frkForm, dateReceived: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={frkForm.expiryDate}
                          onChange={(e) => setFRKForm({ ...frkForm, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={frkForm.notes}
                        onChange={(e) => setFRKForm({ ...frkForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Optional notes..."
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
                        placeholder="Number of rexin stickers"
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
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">ACK Capacity</h4>
                      <div className="text-xs text-gray-600">
                        {stickerForm.quantity && (
                          <div>This will provide capacity for {Math.floor(parseInt(stickerForm.quantity) / 580)} ACKs (580 stickers per ACK)</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Add Stickers
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